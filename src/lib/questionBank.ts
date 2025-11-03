import { Question } from '@/types';

export const QUESTION_BANK: Record<string, Question[]> = {
  "Algebra": [
    {
      id: "alg_1",
      text: "Solve for x: 2x + 5 = 13",
      options: ["x = 4", "x = 6", "x = 9", "x = 18"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_2",
      text: "Simplify: 3(x + 2) - 2x",
      options: ["x + 6", "x + 2", "3x + 6", "5x"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_3",
      text: "What is the value of y if 4y - 7 = 13?",
      options: ["y = 5", "y = 6", "y = 7", "y = 8"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_4",
      text: "Factor: x² + 5x + 6",
      options: ["(x + 2)(x + 3)", "(x + 1)(x + 6)", "(x - 2)(x - 3)", "(x + 5)(x + 1)"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_5",
      text: "Solve: |2x - 3| = 7",
      options: ["x = 5 or x = -2", "x = 5 or x = 2", "x = -5 or x = 2", "x = 5"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_6",
      text: "What is the slope of the line y = 3x - 2?",
      options: ["3", "-2", "2", "-3"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_7",
      text: "Solve the system: 2x + y = 8 and x - y = 1",
      options: ["x = 3, y = 2", "x = 2, y = 4", "x = 4, y = 0", "x = 3, y = 1"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_8",
      text: "What is the y-intercept of y = -2x + 5?",
      options: ["-2", "5", "2", "-5"],
      correctAnswer: 1,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_9",
      text: "Expand: (x + 3)²",
      options: ["x² + 9", "x² + 6x + 9", "x² + 3x + 9", "x² + 6x + 6"],
      correctAnswer: 1,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_10",
      text: "Solve: 3(x - 4) = 2x + 1",
      options: ["x = 13", "x = 11", "x = 9", "x = 7"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_11",
      text: "What is the solution to 5x - 3 = 2x + 9?",
      options: ["x = 4", "x = 3", "x = 5", "x = 6"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    },
    {
      id: "alg_12",
      text: "Factor: x² - 9",
      options: ["(x + 3)(x - 3)", "(x - 9)(x + 1)", "(x + 9)(x - 1)", "(x - 3)²"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_13",
      text: "Solve: x² - 5x + 6 = 0",
      options: ["x = 2 or x = 3", "x = 1 or x = 6", "x = -2 or x = -3", "x = 2 or x = -3"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "medium"
    },
    {
      id: "alg_14",
      text: "What is the domain of f(x) = 1/(x - 3)?",
      options: ["All real numbers except x = 3", "All real numbers", "x > 3", "x < 3"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "hard"
    },
    {
      id: "alg_15",
      text: "Simplify: (x³)(x⁴)",
      options: ["x⁷", "x¹²", "x", "x³⁴"],
      correctAnswer: 0,
      skill: "Algebra",
      difficulty: "easy"
    }
  ],
  "Geometry": [
    {
      id: "geo_1",
      text: "What is the area of a rectangle with length 8 and width 5?",
      options: ["13", "26", "40", "45"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_2",
      text: "What is the perimeter of a square with side length 6?",
      options: ["12", "24", "36", "18"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_3",
      text: "What is the area of a circle with radius 4? (Use π = 3.14)",
      options: ["12.56", "25.12", "50.24", "16"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_4",
      text: "What is the volume of a cube with side length 3?",
      options: ["9", "18", "27", "12"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_5",
      text: "In a right triangle, if one leg is 3 and the other is 4, what is the hypotenuse?",
      options: ["5", "7", "12", "25"],
      correctAnswer: 0,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_6",
      text: "What is the sum of interior angles of a triangle?",
      options: ["90°", "180°", "270°", "360°"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_7",
      text: "What is the area of a triangle with base 10 and height 6?",
      options: ["16", "30", "60", "32"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_8",
      text: "What is the circumference of a circle with diameter 10? (Use π = 3.14)",
      options: ["31.4", "15.7", "78.5", "314"],
      correctAnswer: 0,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_9",
      text: "What is the volume of a cylinder with radius 2 and height 5? (Use π = 3.14)",
      options: ["31.4", "62.8", "20", "15.7"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "hard"
    },
    {
      id: "geo_10",
      text: "What is the area of a parallelogram with base 7 and height 4?",
      options: ["11", "14", "28", "22"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_11",
      text: "How many degrees are in a right angle?",
      options: ["45°", "90°", "180°", "360°"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "easy"
    },
    {
      id: "geo_12",
      text: "What is the sum of interior angles of a quadrilateral?",
      options: ["180°", "270°", "360°", "450°"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_13",
      text: "What is the surface area of a cube with side length 4?",
      options: ["16", "48", "64", "96"],
      correctAnswer: 3,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_14",
      text: "What is the area of a trapezoid with bases 5 and 7, and height 4?",
      options: ["12", "24", "48", "20"],
      correctAnswer: 1,
      skill: "Geometry",
      difficulty: "medium"
    },
    {
      id: "geo_15",
      text: "What is the volume of a rectangular prism with length 5, width 3, and height 4?",
      options: ["12", "24", "60", "72"],
      correctAnswer: 2,
      skill: "Geometry",
      difficulty: "easy"
    }
  ],
  "Calculus": [
    {
      id: "calc_1",
      text: "What is the derivative of f(x) = x²?",
      options: ["x", "2x", "x²", "2"],
      correctAnswer: 1,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_2",
      text: "What is the derivative of f(x) = 5x?",
      options: ["5x", "5", "x", "0"],
      correctAnswer: 1,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_3",
      text: "What is the derivative of f(x) = x³?",
      options: ["3x²", "x²", "3x", "x³"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_4",
      text: "What is the derivative of f(x) = 4?",
      options: ["4", "4x", "0", "1"],
      correctAnswer: 2,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_5",
      text: "What is the derivative of f(x) = 3x² + 2x?",
      options: ["6x + 2", "3x + 2", "6x² + 2x", "x + 1"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "medium"
    },
    {
      id: "calc_6",
      text: "What is the derivative of f(x) = x⁴?",
      options: ["4x³", "x³", "4x", "x⁴"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_7",
      text: "What is the integral of f(x) = 2x?",
      options: ["x²", "2x²", "x² + C", "2x + C"],
      correctAnswer: 2,
      skill: "Calculus",
      difficulty: "medium"
    },
    {
      id: "calc_8",
      text: "What is the derivative of f(x) = sin(x)?",
      options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "medium"
    },
    {
      id: "calc_9",
      text: "What is the derivative of f(x) = e^x?",
      options: ["e^x", "xe^x", "ln(x)", "1"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "hard"
    },
    {
      id: "calc_10",
      text: "What is the derivative of f(x) = 1/x?",
      options: ["-1/x²", "1/x²", "ln(x)", "x"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "medium"
    },
    {
      id: "calc_11",
      text: "What is the integral of f(x) = 1?",
      options: ["x", "x + C", "1", "C"],
      correctAnswer: 1,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_12",
      text: "What is the derivative of f(x) = x² + 3x + 2?",
      options: ["2x + 3", "x + 3", "2x² + 3x", "x² + 3"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "medium"
    },
    {
      id: "calc_13",
      text: "What is the integral of f(x) = x?",
      options: ["x²", "x²/2 + C", "x + C", "1/2"],
      correctAnswer: 1,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_14",
      text: "What is the derivative of f(x) = 5x³?",
      options: ["15x²", "5x²", "15x", "5x³"],
      correctAnswer: 0,
      skill: "Calculus",
      difficulty: "easy"
    },
    {
      id: "calc_15",
      text: "What is the limit as x approaches 0 of sin(x)/x?",
      options: ["0", "1", "∞", "undefined"],
      correctAnswer: 1,
      skill: "Calculus",
      difficulty: "hard"
    }
  ]
};


