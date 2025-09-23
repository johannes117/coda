"""Tests for the sample task module."""

import pytest
import math
from main import calculate_average, find_max, calculate_circle_area, Calculator


class TestUtilityFunctions:
    """Test utility functions."""

    def test_calculate_average_normal(self):
        """Test average calculation with normal input."""
        assert calculate_average([1, 2, 3, 4, 5]) == 3.0
        assert calculate_average([10, 20]) == 15.0

    def test_calculate_average_empty(self):
        """Test average calculation with empty list."""
        assert calculate_average([]) == 0.0

    def test_calculate_average_single(self):
        """Test average calculation with single element."""
        assert calculate_average([42]) == 42.0

    def test_find_max_normal(self):
        """Test finding max with normal input."""
        assert find_max([1, 5, 3, 9, 2]) == 9
        assert find_max([10]) == 10

    def test_find_max_empty(self):
        """Test finding max with empty list."""
        assert find_max([]) is None

    def test_calculate_circle_area_normal(self):
        """Test circle area calculation with normal input."""
        assert calculate_circle_area(1) == math.pi
        assert abs(calculate_circle_area(2) - 4 * math.pi) < 1e-10

    def test_calculate_circle_area_zero(self):
        """Test circle area calculation with zero radius."""
        assert calculate_circle_area(0) == 0

    def test_calculate_circle_area_negative(self):
        """Test circle area calculation with negative radius."""
        with pytest.raises(ValueError, match="Radius cannot be negative"):
            calculate_circle_area(-1)


class TestCalculator:
    """Test Calculator class."""

    def test_calculator_add(self):
        """Test calculator addition."""
        calc = Calculator()
        assert calc.add(5, 3) == 8
        assert calc.add(-1, 1) == 0

    def test_calculator_subtract(self):
        """Test calculator subtraction."""
        calc = Calculator()
        assert calc.subtract(10, 3) == 7
        assert calc.subtract(5, 10) == -5

    def test_calculator_multiply(self):
        """Test calculator multiplication."""
        calc = Calculator()
        assert calc.multiply(4, 5) == 20
        assert calc.multiply(-2, 3) == -6

    def test_calculator_divide(self):
        """Test calculator division."""
        calc = Calculator()
        assert calc.divide(10, 2) == 5
        assert calc.divide(7, 2) == 3.5

    def test_calculator_divide_by_zero(self):
        """Test calculator division by zero."""
        calc = Calculator()
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calc.divide(5, 0)

    def test_calculator_history(self):
        """Test calculator history tracking."""
        calc = Calculator()

        calc.add(1, 2)
        calc.multiply(3, 4)

        history = calc.get_history()
        assert len(history) == 2
        assert "1.0 + 2.0 = 3.0" in history
        assert "3.0 * 4.0 = 12.0" in history

    def test_calculator_clear_history(self):
        """Test clearing calculator history."""
        calc = Calculator()

        calc.add(1, 2)
        calc.subtract(5, 3)
        assert len(calc.get_history()) == 2

        calc.clear_history()
        assert len(calc.get_history()) == 0