What this app does
This page is a small numerical analysis tool with three main sections:

Root Finding

Solve equations using Bisection, False Position, Newton, Secant, or Fixed Point methods.
Shows iteration tables, convergence status, and a Plotly graph of the function.
Linear Systems

Solve a system of linear equations using:
Gaussian Elimination
Gaussian Elimination with Partial Pivoting
Gauss-Jordan Elimination
LU Decomposition
Cramer’s Rule
Optimization

Solve optimization problems with:
Golden-Section Search for 1D functions
Steepest Ascent / Descent for 2D functions
How to use it
Root Finding tab
Select a method from the dropdown.
Fill the input fields shown for that method:
Bisection / False Position: function and bracket [xl, xu]
Newton: f(x), f'(x), and initial guess x0
Secant: f(x) and starting values x0, x1
Fixed Point: f(x) and initial guess x0
Enter tolerance, maximum iterations, and decimal places.
Click Solve.
The result appears in the results box with a step table; click a row to show details.
Linear Systems tab
Choose a solver from the dropdown.
Enter the system size n × n (2 to 4).
Fill the coefficient matrix A and constants vector b.
Click Solve.
The solution and verification table appear below.
Optimization tab
Choose either Golden-Section or Steepest Ascent/Descent.
Fill the shown input fields:
Golden-Section: f(x), xl, xu, maximize/minimize
Steepest Ascent: f(x,y), starting point x0, y0, maximize/minimize
Enter tolerance and max iterations.
Click Solve.
The optimal value and iteration table appear.
Main functions in the code
Expression parsing
createFunction(expr)

Converts a 1D math string like x^2 + 2*x into a JavaScript function f(x).
Supports ^, sqrt(), sin(), cos(), tan(), exp(), ln(), log(), abs(), etc.
Throws an error if the expression is invalid.
createFunction2D(expr)

Converts a 2D expression like x^2 + y^2 into a JavaScript function f(x,y).
Used for optimization with two variables.
evaluatePolynomial(coeffs, x)

Computes a polynomial value from coefficients.
Example: coefficients [2, -3, 1] means 2x^2 - 3x + 1.
parsePolynomialOrFunction(input)

Detects whether input is comma-separated coefficients or a general expression.
Returns either a polynomial evaluator or a parsed function.
Root finding methods
bisectionMethod(f, a, b, tol, maxIter, decimalPlaces)

Uses the bisection algorithm.
Requires f(a) and f(b) to have opposite signs.
Halves the interval repeatedly until tolerance or max iterations.
falsePositionMethod(f, a, b, tol, maxIter, decimalPlaces)

Uses linear interpolation between the bracket endpoints.
Similar to bisection but uses a secant-like estimate.
newtonsMethod(f, fPrime, x0, tol, maxIter, decimalPlaces)

Newton-Raphson iteration: x_{n+1} = x_n - f(x)/f'(x)
Requires the derivative function too.
Stops when either function value or relative error is small.
secantMethod(f, x0, x1, tol, maxIter, stopCriterion, decimalPlaces)

Secant method uses two starting points and no derivative.
Can stop based on:
relative error (error-percent)
function value magnitude (function-value)
buildAutoFixedPointFunction(f, x0, funcStr)

Attempts to transform f(x)=0 into a fixed-point iteration x = g(x).
It tries a polynomial-style rearrangement first.
If that fails, it builds g(x) = x - λ f(x) automatically.
Also estimates whether the iteration is stable near the starting point.
fixedPointMethod(g, x0, tol, maxIter, decimalPlaces, lambda)

Iterates x_{n+1} = g(x_n) until convergence.
Checks stability using the derivative of g(x) and warns if unstable.
Plotting
plotFunctionAndSlope(f, root, slopeX0, slopeX1)
Uses Plotly to draw:
the function curve f(x)
a tangent or secant line near the root
the final root point
Runs for root-finding results and fixed-point plots.
UI and helper functions
switchTab(tabName)

Changes which tab is visible (root finding, linear systems, optimization).
expandIterationRow(rowElement, iterationData)

Shows extra step details for a table row when clicked.
updateRootMethodUI()

Shows/hides input fields depending on the chosen root-finding method.
Updates example text and method description.
fillRootExampleData()

Loads predefined example settings for the currently selected root method.
solveRootFinding()

Reads form values for the current root method.
Calls the selected algorithm.
Renders result cards and iteration tables.
Plots the function if possible.
clearRootResults()

Resets root finding inputs and clears results.
document.addEventListener("DOMContentLoaded", ...)

Calls updateRootMethodUI() when the page loads.
Linear algebra functions
generateMatrixInputs()

Builds matrix input fields for the chosen matrix size.
Fills a sample 3×3 matrix if possible.
fillLinearExampleData()

Sets matrix size to 3 and populates example values.
getMatrixFromInputs()

Reads matrix A and vector b from the page inputs.
Returns the matrix and constants.
backSubstitution(A, b)

Solves Ux = b for an upper-triangular matrix U.
gaussianElimination(A, b)

Forward elimination without pivoting, then back substitution.
gaussianEliminationPP(A, b)

Gaussian elimination with partial pivoting for numerical stability.
gaussJordanElimination(A, b)

Reduces the augmented matrix fully to reduced row echelon form.
Returns the solution vector.
luDecomposition(A)

Decomposes matrix A into L and U.
Used with forwardSubstitution and backSubstitution.
forwardSubstitution(L, b)

Solves Ly = b for lower-triangular L.
determinant(matrix)

Computes the determinant recursively.
Used for Cramer’s Rule.
cramersRule(A, b)

Uses determinants to solve Ax = b.
solveLinearSystem()

Reads the selected linear method and matrix inputs.
Runs the chosen solver.
Displays the solution and verification table.
clearLinearResults()

Clears the matrix inputs and results.
Optimization functions
goldenSectionSearch(f, xl, xu, tol, maxIter, findMax, decimalPlaces)

Searches for the maximum or minimum of a unimodal 1D function.
Uses golden-section interval reduction.
partialX(f, x, y), partialY(f, x, y)

Approximate first partial derivatives for 2D optimization.
partialXX(f, x, y), partialYY(f, x, y), partialXY(f, x, y)

Approximate second partial derivatives for Hessian analysis.
steepestMethod(f, x0, y0, tol, maxIter, findMax, decimalPlaces)

Uses gradient direction plus a line search to move toward optimum.
Works for 2D functions f(x,y).
updateOptMethodUI()

Switches optimization inputs based on selected method.
Loads method description and examples.
fillOptExampleData()

Populates example values for the current optimization method.
solveOptimization()

Reads optimization inputs.
Runs the chosen method.
Displays the optimum and iteration table.
clearOptResults()

Clears optimization inputs and result output.# bisection-calc.
