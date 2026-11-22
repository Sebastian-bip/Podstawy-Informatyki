import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DONE_TASKS_COOKIE,
  buildCookieString,
  decodeMasteredTasks,
  encodeMasteredTasks,
  loadMasteredTasksFromCookieString,
  parseCookies,
} from './cookies.ts';

test('parseCookies parses multiple cookies and URI-encoded values safely', () => {
  const header = 'foo=bar; pi_done_tasks=d-1%2Ce-5%2Cb-12; pi_cookie_notice=1; weird=a=b';
  const parsed = parseCookies(header);
  assert.equal(parsed.foo, 'bar');
  assert.equal(parsed[DONE_TASKS_COOKIE], 'd-1,e-5,b-12');
  assert.equal(parsed.pi_cookie_notice, '1');
  assert.equal(parsed.weird, 'a=b');
});

test('encodeMasteredTasks and decodeMasteredTasks round-trip only truthy valid IDs', () => {
  const input = {
    'd-1': true,
    'd-2': false,
    'e-12': true,
    'b-13': true,
    'invalid id!': true,
  };
  const encoded = encodeMasteredTasks(input);
  assert.equal(encoded, 'd-1,e-12,b-13');

  const decoded = decodeMasteredTasks(encoded);
  assert.deepEqual(decoded, {
    'd-1': true,
    'e-12': true,
    'b-13': true,
  });
});

test('loadMasteredTasksFromCookieString distinguishes missing vs empty vs populated cookie', () => {
  assert.deepEqual(loadMasteredTasksFromCookieString('other=123'), {
    found: false,
    tasks: {},
  });

  assert.deepEqual(loadMasteredTasksFromCookieString('pi_done_tasks='), {
    found: true,
    tasks: {},
  });

  assert.deepEqual(loadMasteredTasksFromCookieString('pi_cookie_notice=1; pi_done_tasks=d-3%2Cb-1'), {
    found: true,
    tasks: { 'd-3': true, 'b-1': true },
  });
});

test('buildCookieString includes attributes and omits Secure when not HTTPS', () => {
  const httpCookie = buildCookieString(DONE_TASKS_COOKIE, 'd-1,e-2', {
    maxAgeSeconds: 31536000,
    secure: false,
  });
  assert.equal(
    httpCookie,
    'pi_done_tasks=d-1%2Ce-2; Max-Age=31536000; Path=/; SameSite=Lax'
  );

  const httpsCookie = buildCookieString(DONE_TASKS_COOKIE, 'd-1', {
    maxAgeSeconds: 3600,
    secure: true,
  });
  assert.ok(httpsCookie.endsWith('; Secure'));
});
