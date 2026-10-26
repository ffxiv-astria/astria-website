import assert from 'node:assert/strict';
import test from 'node:test';
import { canOpenAppleApp, challengeShareUrl, detectShareContext, parseChallengeShare, readChallengeCode } from '../src/lib/player-challenge-share.ts';

const share = {
  code: 'ABCD2345', status: 'ok', target: { type: 'player_challenge_same_set', id: 'id' },
  preview: { title: '<img src=x onerror=alert(1)>', subtitle: 'knowledge · 10题', author: '作者' },
  appLink: 'astria://player-challenges/123e4567-e89b-42d3-a456-426614174000?sameSetCode=ABCD2345', miniappPath: 'subPackages/share/pages/resolve/index?code=ABCD2345',
  url: 'https://malicious.invalid/s/ABCD2345', sourceRunId: 'private-run', grading: { answer: 'private' },
};

test('only exact independent public challenge paths and eight character codes are accepted', () => {
  assert.equal(readChallengeCode('/pc/abcd2345', ''), 'ABCD2345');
  assert.equal(readChallengeCode('/pc/', '?c=ABCD2345'), 'ABCD2345');
  for (const path of ['/s/ABCD2345', '/pc/ABCD2345/extra', '/pc/%E0%A4%A', '/pc/ABCD23456789', '/pc/IIIIIIII']) {
    assert.equal(readChallengeCode(path, '?c=ABCD2345'), null);
  }
});

test('public parser retains only safe preview fields and the exact challenge app target', () => {
  const parsed = parseChallengeShare(share, 'ABCD2345')!;
  assert.equal(parsed.title, share.preview.title);
  assert.equal(parsed.kind, 'player_challenge_same_set');
  assert.ok(!('sourceRunId' in parsed));
  assert.ok(!('grading' in parsed));
  assert.ok(!('url' in parsed));
  assert.equal(parseChallengeShare({ ...share, code: 'ABCD2346' }, 'ABCD2345'), null);
  assert.equal(parseChallengeShare({ ...share, target: { type: 'gearset' } }, 'ABCD2345'), null);
  for (const appLink of ['javascript:alert(1)', 'astria://share/ABCD2345', 'astria://pc/ABCD2346', 'astria://player-challenges/123e4567-e89b-42d3-a456-426614174000?sameSetCode=ABCD2346', 'astria://pc/ABCD2345?run=private']) {
    assert.equal(parseChallengeShare({ ...share, appLink }, 'ABCD2345')!.appLink, null);
  }
});

test('unavailable targets never retain preview text, app actions or mini-program access', () => {
  const parsed = parseChallengeShare({ ...share, status: 'unavailable' }, 'ABCD2345')!;
  assert.equal(parsed.title, '');
  assert.equal(parsed.subtitle, null);
  assert.equal(parsed.author, null);
  assert.equal(parsed.appLink, null);
  assert.equal(parsed.miniappAvailable, false);
});

test('Android browsers including QQ and WeChat never offer an App invocation', () => {
  const parsed = parseChallengeShare(share, 'ABCD2345')!;
  for (const ua of ['Mozilla Android Mobile', 'Mozilla Android MicroMessenger', 'Mozilla Android QQ/9.0']) {
    const context = detectShareContext(ua);
    assert.equal(context.platform, 'android');
    assert.equal(canOpenAppleApp(context, parsed), false);
  }
  assert.equal(canOpenAppleApp(detectShareContext('Mozilla iPhone Mobile'), parsed), true);
  assert.equal(canOpenAppleApp(detectShareContext('Mozilla Macintosh', 'MacIntel', 5), parsed), true);
  assert.equal(canOpenAppleApp(detectShareContext('Mozilla iPhone MicroMessenger'), parsed), false);
  assert.equal(canOpenAppleApp(detectShareContext('Windows'), parsed), false);
});

test('copied URLs retain the independent route and same-set code', () => {
  assert.equal(challengeShareUrl('https://astria.cxmeow.top', 'ABCD2345'), 'https://astria.cxmeow.top/pc/ABCD2345');
  assert.throws(() => challengeShareUrl('https://astria.cxmeow.top', '../s/ABCD2345'));
});
