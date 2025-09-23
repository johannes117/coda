"""Sample Python project for testing Coda's code editing capabilities."""

import math
from typing import List, Optional


def calculate_average(numbers: List[float]) -> float:
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)


def find_max(numbers: List[float]) -> Optional[float]:
    """Find the maximum value in a list of numbers."""
    if not numbers:
        return None
    return max(numbers)


def calculate_circle_area(radius: float) -> float:
    """Calculate the area of a circle given its radius."""
    if radius < 0:
        raise ValueError("Radius cannot be negative")
    return math.pi * radius ** 2


class Calculator:
    """Simple calculator class."""

    def __init__(self):
        self.history: List[str] = []

    def add(self, a: float, b: float) -> float:
        """Add two numbers."""
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

    def subtract(self, a: float, b: float) -> float:
        """Subtract b from a."""
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result

    def multiply(self, a: float, b: float) -> float:
        """Multiply two numbers."""
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result

    def divide(self, a: float, b: float) -> float:
        """Divide a by b."""
        if b == 0:
            raise ValueError("Cannot divide by zero")
        result = a / b
        self.history.append(f"{a} / {b} = {result}")
        return result

    def get_history(self) -> List[str]:
        """Get calculation history."""
        return self.history.copy()

    def clear_history(self) -> None:
        """Clear calculation history."""
        self.history.clear()


if __name__ == "__main__":
    # Example usage
    calc = Calculator()

    print("Testing calculator:")
    print(f"5 + 3 = {calc.add(5, 3)}")
    print(f"10 - 4 = {calc.subtract(10, 4)}")
    print(f"6 * 7 = {calc.multiply(6, 7)}")
    print(f"15 / 3 = {calc.divide(15, 3)}")

    print("\nTesting utility functions:")
    numbers = [1, 2, 3, 4, 5]
    print(f"Average of {numbers}: {calculate_average(numbers)}")
    print(f"Max of {numbers}: {find_max(numbers)}")
    print(f"Circle area (radius=5): {calculate_circle_area(5)}")

    print("\nCalculation history:")
    for entry in calc.get_history():
        print(f"  {entry}")