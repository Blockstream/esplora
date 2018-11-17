#!/usr/bin/env python3

import argparse
import json

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--json-to-txt', action='store_true')
    group.add_argument('--txt-to-json', action='store_true')
    parser.add_argument('-i', '--input', type=str, required=True)
    parser.add_argument('-s', '--sourcestrings', type=str, required=True)
    parser.add_argument('-v', '--verbose', help='Increase output verbosity', action='store_true')

    args = parser.parse_args()

    if args.verbose:
        print('# Verbosity turned on, reading file {}'.format(args.input))

    with open(args.sourcestrings) as f:
        sourcestrings = f.read().splitlines()

    if args.json_to_txt:
        # the translation files in txt format need to be the same number of lines as the uploaded strings file

        with open(args.input) as f:
            data = json.load(f)

        for k in sourcestrings:
            if not k.strip():
                continue
            try:
                if not isinstance(data[k], list):
                    print(data[k])
                else:
                    print(k)
            except KeyError:
                print(k)

    elif args.txt_to_json:
        with open(args.input) as f:
            data = f.read().splitlines()
        print('{')
        json_entries = []
        for i in range(len(sourcestrings)):
            if sourcestrings[i] == data[i]:
                # we don't need the translation if it's the same as english
                continue
            entry = '  "{}": "{}"'.format(sourcestrings[i], data[i])
            json_entries.append(entry)
        print(',\n'.join(json_entries))
        print('}')

if __name__== '__main__':
    main()
