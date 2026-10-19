"""Print the latest stored WhatsApp chat for Ashok, Supriya, or a name they typed."""
import argparse
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'hermes/plugin'))
from fmi_support.review import format_chat, last_chat


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('who', help='Ashok, Supriya, or a name from the chat')
    parser.add_argument('--home', type=Path, default=Path(os.environ.get('HERMES_HOME', '~/.hermes')).expanduser())
    args=parser.parse_args()
    print(format_chat(last_chat(args.home, args.who)))


if __name__=='__main__':
    main()
