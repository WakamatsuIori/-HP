/**
 * ビルド時にカレンダー（.ics）から今後の配信予定を読み込む入口。
 * 取得に失敗した場合は例外を投げてビルドごと失敗させる
 * （中途半端なデータで公開せず、前回の正常なデプロイを残すため。CLAUDE.md §4）。
 */
import { fetchText, type TextFetcher } from './fetcher';
import { parseIcsEvents, type StreamEvent } from './ics';
import { upcomingEvents } from './schedule';

/** 何日先の予定まで表示するか */
export const SCHEDULE_DAYS = 14;

function icsUrl(): string {
  const url = import.meta.env?.ICS_URL ?? process.env.ICS_URL;
  if (!url) {
    throw new Error(
      'ICS_URL が設定されていません。.env ファイルに配信予定カレンダーの .ics URLを設定してください（手順: docs/setup/01-google-calendar.md）',
    );
  }
  return url;
}

/** テストや再利用のための本体（fetcherを差し替え可能） */
export async function loadScheduleWith(fetcher: TextFetcher, now: Date): Promise<StreamEvent[]> {
  const icsText = await fetcher(icsUrl());
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 開催中の予定を取りこぼさない余白
  const windowEnd = new Date(now.getTime() + SCHEDULE_DAYS * 24 * 60 * 60 * 1000);
  const events = parseIcsEvents(icsText, windowStart, windowEnd);
  return upcomingEvents(events, now, SCHEDULE_DAYS);
}

// 本番ビルドではトップとスケジュールの両方から呼ばれるため、結果を使い回す（取得は1回だけ）。
// dev中はキャッシュせず毎回取得する（カレンダーを編集→リロードで即反映を確認できるように）。
let cache: Promise<StreamEvent[]> | null = null;

export function loadSchedule(): Promise<StreamEvent[]> {
  if (import.meta.env.PROD) {
    cache ??= loadScheduleWith(fetchText, new Date());
    return cache;
  }
  return loadScheduleWith(fetchText, new Date());
}

/**
 * 週間ボード（今週/来週）専用の読み込み。
 * upcomingEvents の「これから先だけ」絞りを掛けず、今週の月曜〜来週の日曜を確実に含む広めの窓で読む。
 * → 過ぎた日の予定もボードに残る（消化済みが「休業」に化けない）。一覧/カウントダウンは従来どおり loadSchedule を使う。
 */
export async function loadWeekEventsWith(fetcher: TextFetcher, now: Date): Promise<StreamEvent[]> {
  const icsText = await fetcher(icsUrl());
  // 今週の月曜は最大で6日前、来週の日曜は最大で13日後。余白込みで [-8日, +16日] なら必ず両週を含む。
  const windowStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000);
  return parseIcsEvents(icsText, windowStart, windowEnd);
}

let weekCache: Promise<StreamEvent[]> | null = null;

export function loadWeekEvents(): Promise<StreamEvent[]> {
  if (import.meta.env.PROD) {
    weekCache ??= loadWeekEventsWith(fetchText, new Date());
    return weekCache;
  }
  return loadWeekEventsWith(fetchText, new Date());
}
