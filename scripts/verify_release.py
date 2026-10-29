#!/usr/bin/env python3
"""Verify a local ZIP against one exact asset in the fixed public GitHub repository.

Obtain this script independently of the ZIP. It never extracts or executes it.
Python standard library only; no GitHub token or installed add-on is required.
"""
import argparse
import hashlib
import json
import os
import re
import stat
import sys
import urllib.error
import urllib.parse
import urllib.request

TRUSTED_REPOSITORY = 'Lorie7813/codex-usage-card'
API_ROOT = 'https://api.github.com/repos/' + TRUSTED_REPOSITORY
MAX_METADATA_BYTES = 2 * 1024 * 1024
EXIT_CODES = {'VERIFIED': 0, 'REJECTED': 1, 'UNVERIFIED': 2}


class VerificationFailure(Exception):
    def __init__(self, reason, status='REJECTED'):
        super().__init__(reason)
        self.reason, self.status = reason, status


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def read_api(url):
    request = urllib.request.Request(url, headers={
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'CodexUsageCard-IndependentVerifier',
    })
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(request, timeout=15) as response:
        if response.status != 200 or response.geturl() != url:
            raise VerificationFailure('Unexpected GitHub API response or redirect')
        data = response.read(MAX_METADATA_BYTES + 1)
    if len(data) > MAX_METADATA_BYTES:
        raise VerificationFailure('GitHub release metadata exceeds the size limit')
    return data


def validate_inputs(tag, asset, repository):
    if repository != TRUSTED_REPOSITORY:
        raise VerificationFailure('Repository is not the fixed trusted repository')
    if not isinstance(tag, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]{0,127}', tag):
        raise VerificationFailure('Invalid release tag')
    if '..' in tag or any(part in ('', '.', '..') for part in tag.split('/')) or tag.endswith('.lock'):
        raise VerificationFailure('Invalid release tag')
    if not isinstance(asset, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.zip', asset):
        raise VerificationFailure('Invalid ZIP asset filename')


def hash_local(path):
    try:
        with open(path, 'rb') as stream:
            before = os.fstat(stream.fileno())
            if not stat.S_ISREG(before.st_mode) or before.st_size <= 0:
                raise VerificationFailure('The local ZIP must be a nonempty regular file')
            digest = hashlib.sha256()
            while True:
                block = stream.read(1024 * 1024)
                if not block:
                    break
                digest.update(block)
            after = os.fstat(stream.fileno())
            current = os.stat(path)
        identity = lambda s: (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns)
        if identity(before) != identity(after) or identity(before) != identity(current):
            raise VerificationFailure('The local ZIP changed while being read')
        return digest.hexdigest(), before.st_size
    except OSError:
        raise VerificationFailure('The local ZIP could not be read') from None


def parse_metadata(raw):
    if not isinstance(raw, bytes) or len(raw) > MAX_METADATA_BYTES:
        raise VerificationFailure('Invalid or oversized GitHub release metadata')

    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise VerificationFailure('Duplicate keys in GitHub release metadata')
            result[key] = value
        return result

    def invalid_constant(value):
        raise VerificationFailure('Invalid JSON constant in GitHub release metadata')

    def bounded_integer(value):
        if len(value.lstrip('-')) > 20:
            raise VerificationFailure('Oversized integer in GitHub release metadata')
        return int(value)

    try:
        value = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_keys,
                           parse_constant=invalid_constant, parse_int=bounded_integer)
    except (UnicodeDecodeError, ValueError, RecursionError, OverflowError):
        raise VerificationFailure('GitHub release metadata is not valid JSON') from None
    if not isinstance(value, dict):
        raise VerificationFailure('GitHub release metadata is not an object')
    return value


def exact_https_url(value, host, path):
    if not isinstance(value, str):
        return False
    try:
        parsed = urllib.parse.urlsplit(value)
        return (parsed.scheme == 'https' and parsed.netloc == host and
                not parsed.query and not parsed.fragment and
                urllib.parse.unquote(parsed.path) == path)
    except ValueError:
        return False


def positive_id(value):
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def select_asset(release, tag, filename):
    release_id = release.get('id')
    repo_path = '/' + TRUSTED_REPOSITORY
    if not positive_id(release_id) or release.get('url') != API_ROOT + '/releases/' + str(release_id):
        raise VerificationFailure('Release repository identity does not match')
    if not exact_https_url(release.get('html_url'), 'github.com', repo_path + '/releases/tag/' + tag):
        raise VerificationFailure('Release repository or tag URL does not match')
    if release.get('tag_name') != tag or release.get('draft') is not False:
        raise VerificationFailure('Exact published release tag does not match')
    assets = release.get('assets')
    if not isinstance(assets, list) or not all(isinstance(a, dict) for a in assets):
        raise VerificationFailure('Invalid release asset list')
    matches = [a for a in assets if a.get('name') == filename]
    if len(matches) != 1:
        raise VerificationFailure('Exactly one matching release asset is required')
    asset = matches[0]
    asset_id = asset.get('id')
    if (not positive_id(asset_id) or asset.get('state') != 'uploaded' or
            asset.get('url') != API_ROOT + '/releases/assets/' + str(asset_id)):
        raise VerificationFailure('Asset identity or upload state does not match')
    if not exact_https_url(asset.get('browser_download_url'), 'github.com',
                           repo_path + '/releases/download/' + tag + '/' + filename):
        raise VerificationFailure('Asset repository, tag or filename URL does not match')
    digest = asset.get('digest')
    if not isinstance(digest, str) or not re.fullmatch(r'sha256:[A-Fa-f0-9]{64}', digest):
        raise VerificationFailure('Asset has no valid GitHub SHA256 digest')
    if not positive_id(asset.get('size')):
        raise VerificationFailure('Asset has no valid byte size')
    return asset


def verify_zip(path, tag, asset, *, repository=TRUSTED_REPOSITORY, fetch=None,
               offline=False, expected_sha256=None):
    result = {'status': 'REJECTED', 'repository': TRUSTED_REPOSITORY,
              'provenance': 'UNVERIFIED', 'integrity': 'UNVERIFIED'}
    try:
        validate_inputs(tag, asset, repository)
        result.update(tag=tag, asset=asset)
        digest, size = hash_local(path)
        result.update(sha256=digest, size=size)
        if offline:
            if expected_sha256 is not None:
                if not re.fullmatch(r'[A-Fa-f0-9]{64}', expected_sha256):
                    raise VerificationFailure('Independently obtained SHA256 is invalid')
                if digest != expected_sha256.lower():
                    result['integrity'] = 'MISMATCH'
                    raise VerificationFailure('Local SHA256 differs from the supplied trusted digest')
                result['integrity'] = 'MATCH'
            raise VerificationFailure(
                'Offline: GitHub provenance is UNVERIFIED; a hash alone does not authenticate a publisher',
                'UNVERIFIED')
        if expected_sha256 is not None:
            raise VerificationFailure('Use --sha256 only with --offline')
        url = API_ROOT + '/releases/tags/' + urllib.parse.quote(tag, safe='')
        try:
            raw = (read_api if fetch is None else fetch)(url)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                raise VerificationFailure('The exact GitHub release tag was not found') from None
            if 300 <= error.code < 400:
                raise VerificationFailure('GitHub metadata redirects are not accepted') from None
            raise VerificationFailure('GitHub API is unavailable; provenance is UNVERIFIED',
                                      'UNVERIFIED') from None
        except VerificationFailure:
            raise
        except Exception:
            raise VerificationFailure('Network verification unavailable; provenance is UNVERIFIED',
                                      'UNVERIFIED') from None
        selected = select_asset(parse_metadata(raw), tag, asset)
        if selected['size'] != size:
            result['integrity'] = 'MISMATCH'
            raise VerificationFailure('Local ZIP size differs from the release asset')
        if selected['digest'][7:].lower() != digest:
            result['integrity'] = 'MISMATCH'
            raise VerificationFailure('Local ZIP SHA256 differs from the release asset')
        current_digest, current_size = hash_local(path)
        if current_digest != digest or current_size != size:
            result['integrity'] = 'MISMATCH'
            raise VerificationFailure('The local ZIP changed during verification')
        result.update(status='VERIFIED', provenance='VERIFIED', integrity='MATCH',
                      asset_id=selected['id'],
                      reason='Local bytes match the exact GitHub-published asset; this does not prove publisher identity if GitHub is compromised')
    except VerificationFailure as error:
        result.update(status=error.status, reason=error.reason)
    return result


class SafeParser(argparse.ArgumentParser):
    def error(self, message):
        raise VerificationFailure('Invalid arguments; use --help for usage')


def main(argv=None):
    args_list = sys.argv[1:] if argv is None else argv
    parser = SafeParser(prog='verify_release.py', description=__doc__)
    parser.add_argument('--zip', required=True, dest='zip_path')
    parser.add_argument('--tag', required=True)
    parser.add_argument('--asset', required=True)
    parser.add_argument('--repo', default=TRUSTED_REPOSITORY,
                        help='must equal the fixed trusted repository')
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--sha256', help='independently obtained digest; offline integrity only')
    parser.add_argument('--json', action='store_true')
    try:
        args = parser.parse_args(args_list)
        result = verify_zip(args.zip_path, args.tag, args.asset, repository=args.repo,
                            offline=args.offline, expected_sha256=args.sha256)
    except VerificationFailure as error:
        result = {'status': error.status, 'provenance': 'UNVERIFIED', 'reason': error.reason}
    except Exception:
        result = {'status': 'REJECTED', 'provenance': 'UNVERIFIED',
                  'reason': 'Verification could not complete safely'}
    if '--json' in args_list:
        print(json.dumps(result, sort_keys=True))
    else:
        print(result['status'] + ': ' + result['reason'])
        for field in ['repository', 'tag', 'asset', 'sha256', 'size', 'integrity', 'provenance']:
            if field in result:
                print(field + ': ' + str(result[field]))
    return EXIT_CODES[result['status']]


if __name__ == '__main__':
    sys.exit(main())
