"""Print simple word statistics for a text file or stdin."""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

TOP_N_DEFAULT = 5


@dataclass(frozen=True)
class WordStats:
    total_words: int
    unique_words: int
    most_common: list[tuple[str, int]]


def tokenize(text: str) -> list[str]:
    return [word.strip(".,!?;:\"'()").lower() for word in text.split() if word.strip()]


def compute_stats(text: str, top_n: int = TOP_N_DEFAULT) -> WordStats:
    words = [w for w in tokenize(text) if w]
    counts = Counter(words)
    return WordStats(
        total_words=len(words),
        unique_words=len(counts),
        most_common=counts.most_common(top_n),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, help="file to read (default: stdin)")
    parser.add_argument("-n", "--top", type=int, default=TOP_N_DEFAULT)
    args = parser.parse_args(argv)

    text = args.path.read_text(encoding="utf-8") if args.path else sys.stdin.read()
    stats = compute_stats(text, args.top)

    print(f"Total words:  {stats.total_words}")
    print(f"Unique words: {stats.unique_words}")
    for rank, (word, count) in enumerate(stats.most_common, start=1):
        print(f"  {rank}. {word!r} x{count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
