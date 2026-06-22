// createFunction: parse a mathematical expression string into a JavaScript function
function createFunction(expr) {
  if (!expr || typeof expr !== "string") {
    throw new Error("Expression must be a non-empty string");
  }

  expr = expr.trim();

  let processed = expr
    .replace(/\^/g, "**")
    .replace(/(\d)(\s*)x\b/g, "$1$2*x")
    .replace(/\)\s*\(/g, ")*(")
    .replace(/x\s*\(/g, "x*(")
    .replace(/\)\s*x/g, ")*x")
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\bsin\(/g, "Math.sin(")
    .replace(/\bcos\(/g, "Math.cos(")
    .replace(/\btan\(/g, "Math.tan(")
    .replace(/\basin\(/g, "Math.asin(")
    .replace(/\bacos\(/g, "Math.acos(")
    .replace(/\batan\(/g, "Math.atan(")
    .replace(/\bexp\(/g, "Math.exp(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\babs\(/g, "Math.abs(");

  try {
    const func = new Function("x", `return ${processed}`);
    const testResult = func(1);
    if (isNaN(testResult) || !isFinite(testResult)) {
      throw new Error("Expression evaluation resulted in invalid value");
    }
    return func;
  } catch (error) {
    throw new Error(`Invalid expression: "${expr}"\nDetails: ${error.message}`);
  }
}

// evaluatePolynomial: compute the polynomial value for x using given coefficients
function evaluatePolynomial(coeffs, x) {
  let result = 0;
  const n = coeffs.length;
  for (let i = 0; i < n; i++) {
    result += coeffs[i] * Math.pow(x, n - 1 - i);
  }
  return result;
}

// parsePolynomialOrFunction: detect polynomial coefficient input or parse a general expression
function parsePolynomialOrFunction(input) {
  const trimmed = input.trim();

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((s) => s.trim());
    const coeffs = [];
    let isNumber = true;

    for (const part of parts) {
      const num = parseFloat(part);
      if (isNaN(num)) {
        isNumber = false;
        break;
      }
      coeffs.push(num);
    }

    if (isNumber && coeffs.length > 0) {
      return {
        type: "polynomial",
        coeffs: coeffs,
        func: (x) => evaluatePolynomial(coeffs, x),
        display: `Polynomial with ${coeffs.length} coefficients`,
      };
    }
  }

  try {
    const func = createFunction(trimmed);
    return {
      type: "expression",
      expr: trimmed,
      func: func,
      display: `Expression: ${trimmed}`,
    };
  } catch (error) {
    throw error;
  }
}

// switchTab: show the selected content tab and mark its button active
function switchTab(tabName) {
  const contents = document.querySelectorAll(".content");
  const buttons = document.querySelectorAll(".tab-btn");

  contents.forEach((c) => c.classList.remove("active"));
  buttons.forEach((b) => b.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// expandIterationRow: toggle display of detailed iteration step information

const methodRules = {
  bisection:
    "📌 <strong>Bisection Method:</strong> Finds roots by repeatedly dividing the interval into two equal halves and selecting the subinterval where the sign changes. Requires <strong>f(Xₗ) · f(Xᵤ) &lt; 0</strong>. Guaranteed convergence if the condition is satisfied, but usually slower than open methods. Reliable and simple for general root finding.<br><br>📋 <strong>Rule:</strong><br>Xᵣ = (Xₗ + Xᵤ) / 2",

  "false-position":
    "📌 <strong>False Position Method:</strong> Finds roots using linear interpolation between two bracketing points instead of midpoint division. Requires <strong>f(Xₗ) · f(Xᵤ) &lt; 0</strong>. Usually faster than bisection, but may stall if one endpoint remains fixed too long. Combines bracketing safety with better estimates.<br><br>📋 <strong>Rule:</strong><br>Xᵣ = Xᵤ − [ f(Xᵤ)(Xₗ − Xᵤ) / ( f(Xₗ) − f(Xᵤ) ) ]",

  newton:
    "📌 <strong>Newton's Method:</strong> Uses the tangent line at the current guess to estimate the next root approximation. Requires derivative <strong>f'(x)</strong> and a good initial guess. Very fast quadratic convergence near the root, but may diverge if guess is poor or if <strong>f'(x) ≈ 0</strong>.<br><br>📋 <strong>Rule:</strong><br>Xᵢ₊₁ = Xᵢ − [ f(Xᵢ) / f'(Xᵢ) ]",

  secant:
    "📌 <strong>Secant Method:</strong> Similar to Newton's method but replaces the derivative with a slope calculated from two previous approximations. Does not require derivative. Faster than bisection and often close to Newton speed, but not always guaranteed to converge.<br><br>📋 <strong>Rule:</strong><br>Xᵢ₊₁ = Xᵢ − [ f(Xᵢ)(Xᵢ₋₁ − Xᵢ) / ( f(Xᵢ₋₁) − f(Xᵢ) ) ]",

  "fixed-point":
    "📌 <strong>Fixed Point Method:</strong> Solves <strong>f(x)=0</strong> via repeated substitution. In this app, you enter <strong>f(x)</strong> directly and a suitable <strong>g(x)</strong> is generated automatically. Converges when <strong>|g'(x)| &lt; 1</strong> near the root.<br><br>📋 <strong>Rule:</strong><br>Xᵢ₊₁ = g(Xᵢ)",
};

function expandIterationRow(rowElement, iterationData) {
  let nextRow = rowElement.nextElementSibling;
  if (nextRow && nextRow.classList.contains("iteration-steps-row")) {
    nextRow.remove();
    return;
  }

  const stepsRow = document.createElement("tr");
  stepsRow.className = "iteration-steps-row";
  stepsRow.innerHTML = `
    <td colspan="6" style="background-color: #e8f5e9; padding: 15px; font-family: monospace; white-space: pre-wrap; color: #2e7d32; font-size: 0.85em; border-left: 4px solid #4caf50;">
      <strong>📋 Step Details:</strong>\n${iterationData.steps}
    </td>
  `;
  rowElement.parentNode.insertBefore(stepsRow, rowElement.nextSibling);
}

// updateRootMethodUI: show or hide input fields for the selected root-finding method

function updateRootMethodUI() {
  const method = document.getElementById("root-method").value;

  document.getElementById("bracketing-inputs").style.display = "none";
  document.getElementById("newton-inputs").style.display = "none";
  document.getElementById("secant-inputs").style.display = "none";
  document.getElementById("fixedpoint-inputs").style.display = "none";
  document.getElementById("secant-criterion").style.display = "none";

  const ruleBox = document.getElementById("method-rule");
  ruleBox.innerHTML = methodRules[method] || "";
  ruleBox.classList.add("show");

  const testExampleDiv = document.getElementById("test-example");
  const testExamples = {
    bisection:
      "<strong>✅ Test Example:</strong> <code>-0.6x^2 + 2.4x + 5.5 </code>",
    "false-position":
      "<strong>✅ Test Example:</strong> <code>-0.6x^2 + 2.4x + 5.5 </code>",
    newton:
      "<strong>✅ Test Example:</strong> <code>f(x): 0.95*x^3-5.9*x^2+10.9*x-6</code> <code>f'(x): 2.85*x^2-11.8*x+10.9</code> <code>x₀: 3</code>",
    secant:
      "<strong>✅ Test Example:</strong> <code>0.95*x^3-5.9*x^2+10.9*x-6</code> <code>x₀: 0 , x₁: 1</code>",
    "fixed-point":
      "<strong>✅ Test Example:</strong> <code>f(x): x^5-2.5*x+1</code> <code>x₀: 5</code> (auto-transformed to g(x))",
  };
  const exampleButtonHtml = `
    <div class="example-button-wrap">
      <button class="btn-example" onclick="fillRootExampleData()">
        Use this example
      </button>
    </div>`;

  testExampleDiv.innerHTML = `${testExamples[method] || ""}${exampleButtonHtml}`;

  switch (method) {
    case "bisection":
    case "false-position":
      document.getElementById("bracketing-inputs").style.display = "block";
      break;
    case "newton":
      document.getElementById("newton-inputs").style.display = "block";
      break;
    case "secant":
      document.getElementById("secant-inputs").style.display = "block";
      document.getElementById("secant-criterion").style.display = "block";
      break;
    case "fixed-point":
      document.getElementById("fixedpoint-inputs").style.display = "block";
      break;
  }
}

// fillRootExampleData: populate example inputs for the selected root-finding method
function fillRootExampleData() {
  const method = document.getElementById("root-method").value;
  const examples = {
    bisection: {
      poly: "-0.6x^2 + 2.4x + 5.5",
      xLower: -5,
      xUpper: 0,
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 3,
    },
    "false-position": {
      poly: "-0.6x^2 + 2.4x + 5.5",
      xLower: -5,
      xUpper: 0,
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 3,
    },
    newton: {
      func: "0.95*x^3-5.9*x^2+10.9*x-6",
      deriv: "2.85*x^2-11.8*x+10.9",
      x0: 3,
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 3,
    },
    secant: {
      func: "0.95*x^3-5.9*x^2+10.9*x-6",
      x0: 0,
      x1: 1,
      stopCriterion: "error-percent",
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 3,
    },
    "fixed-point": {
      func: "x^5-2.5*x+1",
      x0: 5,
      tol: 5,
      maxIter: 50,
      decimalPlaces: 3,
    },
  };

  const example = examples[method];
  if (!example) return;

  document.getElementById("root-tol").value = example.tol;
  document.getElementById("max-iter").value = example.maxIter;
  document.getElementById("decimal-places").value = example.decimalPlaces;

  if (method === "bisection" || method === "false-position") {
    document.getElementById("poly-coeffs").value = example.poly;
    document.getElementById("x-lower").value = example.xLower;
    document.getElementById("x-upper").value = example.xUpper;
  }

  if (method === "newton") {
    document.getElementById("newton-func").value = example.func;
    document.getElementById("newton-deriv").value = example.deriv;
    document.getElementById("x0").value = example.x0;
  }

  if (method === "secant") {
    document.getElementById("secant-func").value = example.func;
    document.getElementById("x0-s").value = example.x0;
    document.getElementById("x1-s").value = example.x1;
    document.getElementById("secant-stop").value = example.stopCriterion;
  }

  if (method === "fixed-point") {
    document.getElementById("fixedpoint-func").value = example.func;
    document.getElementById("x0-fp").value = example.x0;
  }
}

// bisectionMethod: find a root by halving the interval where the function changes sign
function bisectionMethod(f, a, b, tol, maxIter, decimalPlaces = 6) {
  const iterations = []; // store iteration rows for display
  let c = (a + b) / 2; // midpoint of the current bracket
  let iter = 0; // current iteration index
  let prevC = 0; // previous midpoint for error calculation

  const fa = f(a); // f at lower bracket
  const fb = f(b); // f at upper bracket

  if (fa * fb >= 0) {
    throw new Error(
      `❌ BRACKETING FAILED!\nf(${a}) = ${fa.toFixed(6)}\nf(${b}) = ${fb.toFixed(6)}\n\nBoth have same sign. Need f(a) × f(b) < 0`,
    );
  }

  while (iter < maxIter) {
    c = (a + b) / 2; // new midpoint estimate
    const fc = f(c); // function value at midpoint

    let error = iter === 0 ? 100 : Math.abs((c - prevC) / c) * 100; // relative error percent

    let stepDetails = `xₗ = ${a.toFixed(decimalPlaces)}, xᵤ = ${b.toFixed(decimalPlaces)} → xᵣ = (${a.toFixed(decimalPlaces)} + ${b.toFixed(decimalPlaces)}) / 2 = ${c.toFixed(decimalPlaces)}`;
    if (iter > 0) {
      stepDetails += `\nRelative Error: |${c.toFixed(decimalPlaces)} - ${prevC.toFixed(decimalPlaces)}| / |${c.toFixed(decimalPlaces)}| × 100 = ${error.toFixed(decimalPlaces)}%`;
    }
    if (fa * fc < 0) {
      stepDetails += `\nf(xₗ) × f(xᵣ) = ${fa.toFixed(decimalPlaces)} × ${fc.toFixed(decimalPlaces)} < 0, so xᵤ = ${c.toFixed(decimalPlaces)}`;
    } else {
      stepDetails += `\nf(xₗ) × f(xᵣ) = ${fa.toFixed(decimalPlaces)} × ${fc.toFixed(decimalPlaces)} > 0, so xₗ = ${c.toFixed(decimalPlaces)}`;
    }

    iterations.push({
      iteration: iter + 1,
      xl: a,
      xu: b,
      xr: c,
      f_xr: fc,
      error: error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (Math.abs(fc) < 1e-14) break; // stop if midpoint is effectively a root
    if (iter > 0 && error < tol) break; // stop on tolerance

    if (fa * fc < 0) {
      b = c; // root remains in left half
    } else {
      a = c; // root remains in right half
    }

    prevC = c; // update previous midpoint
    iter++; // next iteration
  }

  return {
    root: c,
    iterations,
    converged: iter > 0 && Math.abs((c - prevC) / c) * 100 < tol,
  };
}

// falsePositionMethod: find a root by linear interpolation between bracket endpoints
function falsePositionMethod(f, a, b, tol, maxIter, decimalPlaces = 6) {
  const iterations = []; // store iteration records
  let c = b; // current root estimate
  let iter = 0; // iteration counter
  let prevC = 0; // previous estimate for error calculation

  const fa = f(a); // f at lower bound
  const fb = f(b); // f at upper bound

  if (fa * fb >= 0) {
    throw new Error(
      `❌ BRACKETING FAILED!\nf(${a}) = ${fa.toFixed(6)}\nf(${b}) = ${fb.toFixed(6)}\n\nBoth have same sign. Need f(a) × f(b) < 0`,
    );
  }

  while (iter < maxIter) {
    const fa = f(a); // update f(a) each iteration
    const fb = f(b); // update f(b)
    c = b - (fb * (a - b)) / (fa - fb); // false position formula
    const fc = f(c); // function value at the estimate

    let error = iter === 0 ? 100 : Math.abs((c - prevC) / c) * 100; // relative error percent

    let stepDetails = `xᵣ = ${b.toFixed(decimalPlaces)} - (${fb.toFixed(decimalPlaces)} × (${a.toFixed(decimalPlaces)} - ${b.toFixed(decimalPlaces)})) / (${fa.toFixed(decimalPlaces)} - ${fb.toFixed(decimalPlaces)}) = ${c.toFixed(decimalPlaces)}`;
    if (iter > 0) {
      stepDetails += `\nRelative Error: |${c.toFixed(decimalPlaces)} - ${prevC.toFixed(decimalPlaces)}| / |${c.toFixed(decimalPlaces)}| × 100 = ${error.toFixed(decimalPlaces)}%`;
    }

    iterations.push({
      iteration: iter + 1,
      xl: a,
      xu: b,
      xr: c,
      f_xr: fc,
      error: error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (Math.abs(fc) < 1e-14) break; // stop if root found accurately enough
    if (iter > 0 && error < tol) break; // stop on tolerance

    if (fa * fc < 0) {
      b = c; // keep left subinterval
    } else {
      a = c; // keep right subinterval
    }

    prevC = c; // update previous value
    iter++; // next iteration
  }

  return {
    root: c,
    iterations,
    converged: iter > 0 && Math.abs((c - prevC) / c) * 100 < tol,
  };
}

// newtonsMethod: use Newton-Raphson iterations to find a root using derivative information
function newtonsMethod(f, fPrime, x0, tol, maxIter, decimalPlaces = 6) {
  const iterations = []; // store each iteration result
  let x = x0; // current approximation of root
  let iter = 0; // iteration count
  let prevX = 0; // previous x for error calculation

  while (iter < maxIter) {
    const fx = f(x); // f(x) at current approximation
    const fpx = fPrime(x); // f'(x) at current approximation

    if (Math.abs(fpx) < 1e-10)
      throw new Error(`Derivative too close to zero at x = ${x.toFixed(6)}`);

    const xNew = x - fx / fpx; // Newton update x_{n+1} = x_n - f(x)/f'(x)
    const error = iter === 0 ? 100 : Math.abs((xNew - x) / xNew) * 100; // relative error percent

    let stepDetails = `xₙ₊₁ = ${x.toFixed(decimalPlaces)} - ${fx.toFixed(decimalPlaces)} / ${fpx.toFixed(decimalPlaces)} = ${xNew.toFixed(decimalPlaces)}`;
    if (iter > 0) {
      stepDetails += `\nRelative Error: |${xNew.toFixed(decimalPlaces)} - ${x.toFixed(decimalPlaces)}| / |${xNew.toFixed(decimalPlaces)}| × 100 = ${error.toFixed(decimalPlaces)}%`;
    }

    iterations.push({
      iteration: iter + 1,
      x: x,
      f_x: fx,
      fprime_x: fpx,
      x_new: xNew,
      error: error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (Math.abs(fx) < 1e-14) break; // stop if function value is close to zero
    if (iter > 0 && error < tol) break; // stop on tolerance condition

    x = xNew; // update current approximation
    prevX = xNew; // update previous approximation
    iter++; // increment iteration count
  }

  return {
    root: x,
    iterations,
    converged: iter > 0 && Math.abs((x - prevX) / x) * 100 < tol,
  };
}

// secantMethod: approximate a root using secant line iterations without explicit derivative
function secantMethod(
  f,
  x0,
  x1,
  tol,
  maxIter,
  stopCriterion = "error-percent",
  decimalPlaces = 6,
) {
  const iterations = []; // store iteration details
  let iter = 0; // iteration counter

  while (iter < maxIter) {
    const fx0 = f(x0); // function value at previous approximation
    const fx1 = f(x1); // function value at current approximation

    if (Math.abs(fx1 - fx0) < 1e-15)
      throw new Error("Function values too close together!");

    const x2 = x1 - (fx1 * (x1 - x0)) / (fx1 - fx0); // secant update formula
    const fx2 = f(x2); // evaluate function at new estimate

    let error = Math.abs((x2 - x1) / x2) * 100; // relative error percent

    let stepDetails = `xₙ₊₁ = ${x1.toFixed(decimalPlaces)} - (${fx1.toFixed(decimalPlaces)} × (${x1.toFixed(decimalPlaces)} - ${x0.toFixed(decimalPlaces)})) / (${fx1.toFixed(decimalPlaces)} - ${fx0.toFixed(decimalPlaces)}) = ${x2.toFixed(decimalPlaces)}`;
    stepDetails += `\nRelative Error: |${x2.toFixed(decimalPlaces)} - ${x1.toFixed(decimalPlaces)}| / |${x2.toFixed(decimalPlaces)}| × 100 = ${error.toFixed(decimalPlaces)}%`;

    iterations.push({
      iteration: iter + 1,
      xn_minus_1: x0,
      xn: x1,
      xn_plus_1: x2,
      f_xn: fx1,
      error: error,
      steps: stepDetails,
      errorPercent: error,
    });

    iter++; // increment iteration count

    let shouldStop = false; // determine if stopping condition is met
    if (stopCriterion === "error-percent") {
      shouldStop = error < tol; // stop when relative error is below tolerance
    } else if (stopCriterion === "function-value") {
      shouldStop = Math.abs(fx2) < tol; // stop when function value is small
    }

    if (shouldStop) {
      break;
    }

    x0 = x1; // shift previous approximation
    x1 = x2; // update current approximation
  }

  return { root: x1, iterations, converged: true };
}

// buildAutoFixedPointFunction: derive a stable fixed-point g(x) from f(x) when possible
function buildAutoFixedPointFunction(f, x0, funcStr = "") {
  const normalized = String(funcStr || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\*\*/g, "^");

  const polyMatch = normalized.match(
    /^x\^(\d+)([+\-]\d*\.?\d+)\*?x([+\-]\d*\.?\d+)$/,
  );
  if (polyMatch) {
    const n = parseInt(polyMatch[1], 10);
    const c = parseFloat(polyMatch[2]);
    const d = parseFloat(polyMatch[3]);
    const isOdd = n % 2 === 1;

    if (
      Number.isFinite(n) &&
      n >= 2 &&
      Number.isFinite(c) &&
      Number.isFinite(d)
    ) {
      const g = (x) => {
        const rhs = -c * x - d; // compute right-hand side of root rearrangement
        if (rhs < 0 && !isOdd) return NaN;
        return isOdd
          ? Math.sign(rhs) * Math.pow(Math.abs(rhs), 1 / n)
          : Math.pow(rhs, 1 / n);
      };
      const h = 1e-6;
      const gPrimeAtX0 = (g(x0 + h) - g(x0 - h)) / (2 * h); // numeric derivative at x0
      const stableAtX0 =
        isFinite(gPrimeAtX0) && !isNaN(gPrimeAtX0) && Math.abs(gPrimeAtX0) < 1;
      return {
        g,
        lambda: null,
        gPrimeAtX0,
        stableAtX0,
        transformLabel: `x = (${(-c).toFixed(6)}*x ${d >= 0 ? "-" : "+"} ${Math.abs(d).toFixed(6)})^(1/${n})`,
      };
    }
  }

  const h = 1e-6;
  const fPrimeAtX0 = (f(x0 + h) - f(x0 - h)) / (2 * h); // approximate f'(x0)

  let lambda;
  if (!isFinite(fPrimeAtX0) || isNaN(fPrimeAtX0)) {
    lambda = 0.1;
  } else if (Math.abs(fPrimeAtX0) < 1e-12) {
    lambda = 0.5;
  } else {
    lambda = Math.sign(fPrimeAtX0) / (Math.abs(fPrimeAtX0) + 1);
  }

  const g = (x) => x - lambda * f(x); // fixed-point iteration function
  const gPrimeAtX0 = (g(x0 + h) - g(x0 - h)) / (2 * h); // approximate g'(x0)
  const stableAtX0 =
    isFinite(gPrimeAtX0) && !isNaN(gPrimeAtX0) && Math.abs(gPrimeAtX0) < 1; // convergence test

  return { g, lambda, gPrimeAtX0, stableAtX0 };
}

// fixedPointMethod: iterate x_{n+1} = g(x_n) until convergence or tolerance is met
function fixedPointMethod(
  g,
  x0,
  tol,
  maxIter,
  decimalPlaces = 6,
  lambda = null,
) {
  const iterations = []; // capture each iteration record
  let x = x0; // current fixed-point approximation
  let iter = 0; // iteration counter
  let prevX = 0; // previous approximation for error calculation
  let warning = "";

  const h = 1e-6;
  const gPrimeAtX0 = (g(x0 + h) - g(x0 - h)) / (2 * h); // numeric derivative of g at x0
  if (!isFinite(gPrimeAtX0) || isNaN(gPrimeAtX0)) {
    warning =
      `⚠️ Could not evaluate g'(x) near x₀ = ${x0}. ` +
      `Convergence may be unreliable for this rearrangement.`;
  } else if (Math.abs(gPrimeAtX0) >= 1) {
    warning =
      `⚠️ |g'(x₀)| = ${Math.abs(gPrimeAtX0).toFixed(decimalPlaces)} (>= 1). ` +
      `Fixed-point may diverge from x₀ = ${x0}, but iteration will still be attempted.`;
  }

  while (iter < maxIter) {
    const xNew = g(x);

    // Detect divergence early
    if (!isFinite(xNew) || isNaN(xNew)) {
      throw new Error(
        `Fixed point iteration diverged at iteration ${iter + 1}.\n` +
          `x = ${x.toFixed(decimalPlaces)} → g(x) = ${xNew}\n\n` +
          `The chosen g(x) is unstable near x₀ = ${x0}.\n` +
          `Try a different rearrangement where |g'(x)| < 1 near the root.`,
      );
    }

    const error = iter === 0 ? 100 : Math.abs((xNew - x) / xNew) * 100;

    let stepDetails = `xₙ₊₁ = g(${x.toFixed(decimalPlaces)}) = ${xNew.toFixed(decimalPlaces)}`;
    if (iter > 0) {
      stepDetails += `\nRelative Error: |${xNew.toFixed(decimalPlaces)} - ${x.toFixed(decimalPlaces)}| / |${xNew.toFixed(decimalPlaces)}| × 100 = ${error.toFixed(decimalPlaces)}%`;
    }

    iterations.push({
      iteration: iter + 1,
      x_old: x,
      x_new: xNew,
      g_x: xNew,
      error: error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (iter > 0 && error < tol) break;

    x = xNew;
    prevX = xNew;
    iter++;
  }

  return {
    root: x,
    iterations,
    warning,
    lambda,
    converged: iter > 0 && Math.abs((x - prevX) / x) * 100 < tol,
  };
}

// plotFunctionAndSlope: render the function curve and slope/secan/tangent line using Plotly
function plotFunctionAndSlope(f, root, slopeX0, slopeX1) {
  try {
    if (typeof Plotly === "undefined") return;

    const plotDiv = document.getElementById("root-plot");
    plotDiv.style.display = "block";

    const center = root;
    const range = Math.max(
      5,
      Math.abs(slopeX0 - root) * 2 + 2,
      Math.abs((slopeX1 ?? root) - root) * 2 + 2,
    );
    const step = (range * 2) / 300;

    const xValues = [];
    const yValues = [];
    for (let x = center - range; x <= center + range; x += step) {
      const y = f(x);
      if (isFinite(y) && Math.abs(y) < 1e8) {
        xValues.push(x);
        yValues.push(y);
      }
    }

    const traces = [];

    traces.push({
      x: xValues,
      y: yValues,
      mode: "lines",
      name: "f(x)",
      line: { color: "#4338ca", width: 2.5 },
    });

    if (slopeX0 !== undefined && slopeX1 !== undefined) {
      const fy0 = f(slopeX0);
      const fy1 = f(slopeX1);
      const slope = (fy1 - fy0) / (slopeX1 - slopeX0);
      const sxMin = center - range;
      const sxMax = center + range;
      const syMin = fy1 + slope * (sxMin - slopeX1);
      const syMax = fy1 + slope * (sxMax - slopeX1);

      traces.push({
        x: [sxMin, slopeX0, slopeX1, sxMax],
        y: [syMin, fy0, fy1, syMax],
        mode: "lines",
        name: "Secant (Slope)",
        line: { color: "#2563eb", width: 2, dash: "dash" },
      });

      traces.push({
        x: [slopeX0, slopeX1],
        y: [fy0, fy1],
        mode: "markers",
        name: "Slope Points",
        marker: {
          color: "#2563eb",
          size: 8,
          symbol: "circle",
          line: { color: "#ffffff", width: 2 },
        },
      });
    } else {
      const delta = 1e-5;
      const slope = (f(root + delta) - f(root - delta)) / (2 * delta);
      traces.push({
        x: [center - range, center + range],
        y: [-slope * range, slope * range],
        mode: "lines",
        name: "Tangent (Slope)",
        line: { color: "#2563eb", width: 2, dash: "dash" },
      });
    }

    traces.push({
      x: [root],
      y: [0],
      mode: "markers+text",
      name: `Root: ${root.toFixed(4)}`,
      text: [`Root: ${root.toFixed(4)}`],
      textposition: "top right",
      textfont: {
        color: "#15803d",
        size: 12,
        family: "Inter, Segoe UI, sans-serif",
      },
      marker: {
        color: "#16a34a",
        size: 11,
        symbol: "circle",
        line: { color: "#ffffff", width: 2 },
      },
    });

    const layout = {
      title: {
        text: "f(x) & Slope Visualization",
        font: {
          color: "#0f172a",
          size: 16,
          family: "Inter, Segoe UI, sans-serif",
          weight: 700,
        },
      },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#f8fafc",
      font: { color: "#334155", family: "Inter, Segoe UI, sans-serif" },
      xaxis: {
        title: { text: "x", font: { color: "#334155" } },
        zeroline: true,
        zerolinecolor: "#94a3b8",
        zerolinewidth: 1.5,
        gridcolor: "#e2e8f0",
        linecolor: "#cbd5e1",
        tickfont: { color: "#475569" },
      },
      yaxis: {
        title: { text: "y", font: { color: "#334155" } },
        zeroline: true,
        zerolinecolor: "#94a3b8",
        zerolinewidth: 1.5,
        gridcolor: "#e2e8f0",
        linecolor: "#cbd5e1",
        tickfont: { color: "#475569" },
      },
      legend: {
        font: { color: "#334155", size: 12 },
        bgcolor: "#ffffff",
        bordercolor: "#e2e8f0",
        borderwidth: 1,
      },
      margin: { t: 55, b: 55, l: 65, r: 30 },
      shapes: [
        {
          type: "rect",
          xref: "paper",
          yref: "paper",
          x0: 0,
          y0: 0,
          x1: 1,
          y1: 1,
          line: { color: "#e2e8f0", width: 1 },
        },
      ],
    };

    Plotly.newPlot("root-plot", traces, layout, { responsive: true });
  } catch (e) {
    console.error("Plotly error:", e);
  }
}

// solveRootFinding: read inputs, run selected root method, and display results
function solveRootFinding() {
  try {
    const method = document.getElementById("root-method").value;
    const tol = parseFloat(document.getElementById("root-tol").value);
    const maxIter = parseInt(document.getElementById("max-iter").value);
    const decimalPlaces =
      parseInt(document.getElementById("decimal-places").value) || 8;
    const resultsDiv = document.getElementById("root-results");

    if (isNaN(tol) || isNaN(maxIter))
      throw new Error("Invalid tolerance or max iterations");

    let result;

    if (method === "bisection" || method === "false-position") {
      const input = document.getElementById("poly-coeffs").value;
      const a = parseFloat(document.getElementById("x-lower").value);
      const b = parseFloat(document.getElementById("x-upper").value);

      if (isNaN(a) || isNaN(b)) throw new Error("Invalid interval values");
      if (a >= b) throw new Error("x_lower must be less than x_upper");

      const parsed = parsePolynomialOrFunction(input);
      const f = parsed.func;

      const fa = f(a);
      const fb = f(b);
      const bracket = fa * fb < 0 ? "✅ Yes" : "❌ No";

      if (method === "bisection") {
        result = bisectionMethod(f, a, b, tol, maxIter, decimalPlaces);
      } else {
        result = falsePositionMethod(f, a, b, tol, maxIter, decimalPlaces);
      }

      let html = `
                        <div class="result-item success">
                            <strong>✅ Root Found: ${result.root.toFixed(decimalPlaces)}</strong>
                            f(root) = ${f(result.root).toFixed(decimalPlaces)}
                        </div>
                        <div class="result-item">
                            <strong>📋 Bracketing Condition [f(xₗ) × f(xᵤ) < 0]: ${bracket}</strong>
                            f(${a}) = ${fa.toFixed(decimalPlaces)}, f(${b}) = ${fb.toFixed(decimalPlaces)}
                        </div>
                        <div class="result-item">
                            <strong>🔄 Convergence: ${result.converged ? "✅ Converged" : "⚠️ Not Converged"}</strong>
                            Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})
                        </div>
                    `;

      if (result.iterations.length > 0) {
        html +=
          "<table class='iterations-table'><tr><th>Iteration</th><th>xₗ</th><th>xᵤ</th><th>xᵣ</th><th>f(xᵣ)</th><th>Error (%)</th></tr>";
        result.iterations.forEach((it, idx) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'>'<td>${it.iteration}</td><td>${it.xl.toFixed(decimalPlaces)}</td><td>${it.xu.toFixed(decimalPlaces)}</td><td>${it.xr.toFixed(decimalPlaces)}</td><td>${it.f_xr.toFixed(decimalPlaces)}</td><td>${it.error.toFixed(decimalPlaces)}</td></tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
    } else if (method === "newton") {
      const funcStr = document.getElementById("newton-func").value;
      const derivStr = document.getElementById("newton-deriv").value;
      const x0 = parseFloat(document.getElementById("x0").value);

      if (isNaN(x0)) throw new Error("Invalid initial guess");

      const f = createFunction(funcStr);
      const fPrime = createFunction(derivStr);

      result = newtonsMethod(f, fPrime, x0, tol, maxIter, decimalPlaces);

      let html = `
                        <div class="result-item success">
                            <strong>✅ Root Found: ${result.root.toFixed(decimalPlaces)}</strong>
                            f(root) = ${f(result.root).toFixed(decimalPlaces)}
                        </div>
                        <div class="result-item">
                            <strong>🔄 Convergence: ${result.converged ? "✅ Converged" : "⚠️ Not Converged"}</strong>
                            Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})
                        </div>
                    `;

      if (result.iterations.length > 0) {
        html +=
          "<table class='iterations-table'><tr><th>Iteration</th><th>xₙ</th><th>f(xₙ)</th><th>f'(xₙ)</th><th>xₙ₊₁</th><th>Error (%)</th></tr>";
        result.iterations.forEach((it, idx) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'>'<td>${it.iteration}</td><td>${it.x.toFixed(decimalPlaces)}</td><td>${it.f_x.toFixed(decimalPlaces)}</td><td>${it.fprime_x.toFixed(decimalPlaces)}</td><td>${it.x_new.toFixed(decimalPlaces)}</td><td>${it.error.toFixed(decimalPlaces)}</td></tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
    } else if (method === "secant") {
      const funcStr = document.getElementById("secant-func").value;
      const x0 = parseFloat(document.getElementById("x0-s").value);
      const x1 = parseFloat(document.getElementById("x1-s").value);
      const stopCriterion = document.getElementById("secant-stop").value;

      if (isNaN(x0) || isNaN(x1)) throw new Error("Invalid initial values");

      const f = createFunction(funcStr);

      result = secantMethod(
        f,
        x0,
        x1,
        tol,
        maxIter,
        stopCriterion,
        decimalPlaces,
      );

      let html = `
                        <div class="result-item success">
                            <strong>✅ Root Found: ${result.root.toFixed(decimalPlaces)}</strong>
                            f(root) = ${f(result.root).toFixed(decimalPlaces)}
                        </div>
                        <div class="result-item">
                            <strong>🔄 Convergence: ${result.converged ? "✅ Converged" : "⚠️ Not Converged"}</strong>
                            Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})
                            <br>Stopping Criterion: ${stopCriterion === "error-percent" ? "Relative Error (%)" : "|f(x)|"}
                        </div>
                    `;

      if (result.iterations.length > 0) {
        html +=
          "<table class='iterations-table'><tr><th>Iteration</th><th>xₙ₋₁</th><th>xₙ</th><th>xₙ₊₁</th><th>f(xₙ)</th><th>Error (%)</th></tr>";
        result.iterations.forEach((it, idx) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'><td>${it.iteration}</td><td>${it.xn_minus_1.toFixed(decimalPlaces)}</td><td>${it.xn.toFixed(decimalPlaces)}</td><td>${it.xn_plus_1.toFixed(decimalPlaces)}</td><td>${it.f_xn.toFixed(decimalPlaces)}</td><td>${it.error.toFixed(decimalPlaces)}</td></tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
    } else if (method === "fixed-point") {
      const funcStr = document.getElementById("fixedpoint-func").value;
      const x0 = parseFloat(document.getElementById("x0-fp").value);

      if (isNaN(x0)) throw new Error("Invalid initial guess");

      const f = createFunction(funcStr);
      const { g, stableAtX0, transformLabel } = buildAutoFixedPointFunction(
        f,
        x0,
        funcStr,
      );

      result = fixedPointMethod(g, x0, tol, maxIter, decimalPlaces);

      let html = `
                        <div class="result-item success">
                            <strong>✅ Root Found (Fixed Point): ${result.root.toFixed(decimalPlaces)}</strong>
                            f(root) = ${f(result.root).toFixed(decimalPlaces)}
                        </div>
                        <div class="result-item">
                            <strong>🔄 Convergence: ${result.converged ? "✅ Converged" : "⚠️ Not Converged"}</strong>
                            Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})
                        </div>
                        <div class="result-item">
                            <strong>⚙️ Auto transformation:</strong> ${transformLabel || "g(x) generated automatically"} (${stableAtX0 ? "stable near x₀" : "possibly unstable near x₀"})
                        </div>
                    `;
      if (result.warning) {
        html += `
                        <div class="result-item">
                            <strong>${result.warning}</strong>
                        </div>
                    `;
      }

      if (result.iterations.length > 0) {
        html +=
          "<table class='iterations-table'><tr><th>Iteration</th><th>xₙ</th><th>xₙ₊₁ = g(xₙ)</th><th>g(xₙ)</th><th>Error (%)</th></tr>";
        result.iterations.forEach((it, idx) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'><td>${it.iteration}</td><td>${it.x_old.toFixed(decimalPlaces)}</td><td>${it.x_new.toFixed(decimalPlaces)}</td><td>${it.g_x.toFixed(decimalPlaces)}</td><td>${it.error.toFixed(decimalPlaces)}</td></tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
      const lastFP = result.iterations[result.iterations.length - 1];
      const fpX0 = lastFP ? lastFP.x_old : undefined;
      const fpX1 = lastFP ? lastFP.x_new : undefined;
      plotFunctionAndSlope(f, result.root, fpX0, fpX1);
    }

    if (method !== "fixed-point") {
      let f;
      let slX0, slX1;
      if (method === "bisection" || method === "false-position") {
        f = parsePolynomialOrFunction(
          document.getElementById("poly-coeffs").value,
        ).func;
        const lastIt = result.iterations[result.iterations.length - 1];
        slX0 = lastIt ? lastIt.xl : undefined;
        slX1 = lastIt ? lastIt.xu : undefined;
      } else if (method === "newton") {
        f = createFunction(document.getElementById("newton-func").value);
        const lastIt = result.iterations[result.iterations.length - 1];
        slX0 = lastIt ? lastIt.x : undefined;
        slX1 = lastIt ? lastIt.x_new : undefined;
      } else if (method === "secant") {
        f = createFunction(document.getElementById("secant-func").value);
        const lastIt = result.iterations[result.iterations.length - 1];
        slX0 = lastIt ? lastIt.xn_minus_1 : undefined;
        slX1 = lastIt ? lastIt.xn : undefined;
      }
      plotFunctionAndSlope(f, result.root, slX0, slX1);
    }

    resultsDiv.classList.add("show");
  } catch (error) {
    alert("❌ ERROR:\n\n" + error.message);
  }
}

// clearRootResults: reset all root-finding form inputs and hide results
function clearRootResults() {
  document.getElementById("root-method").value = "bisection";
  document.getElementById("root-tol").value = "";
  document.getElementById("max-iter").value = "50";
  document.getElementById("decimal-places").value = "3";
  document.getElementById("secant-stop").value = "error-percent";

  document.getElementById("poly-coeffs").value = "";
  document.getElementById("x-lower").value = "";
  document.getElementById("x-upper").value = "";

  document.getElementById("newton-func").value = "";
  document.getElementById("newton-deriv").value = "";
  document.getElementById("x0").value = "";

  document.getElementById("secant-func").value = "0.95*x^3-5.9*x^2+10.9*x-6";
  document.getElementById("x0-s").value = "";
  document.getElementById("x1-s").value = "";

  document.getElementById("fixedpoint-func").value = "x^5-2.5*x+1";
  document.getElementById("x0-fp").value = "";

  updateRootMethodUI();
  document.getElementById("root-results").innerHTML = "";

  const plotDiv = document.getElementById("root-plot");
  if (plotDiv) {
    plotDiv.style.display = "none";
    Plotly.purge(plotDiv);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateRootMethodUI();
});

// generateMatrixInputs: build matrix input fields for the linear-system solver

function generateMatrixInputs() {
  const size = parseInt(document.getElementById("matrix-size").value);
  const container = document.getElementById("matrix-input-container");
  container.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "matrix-header-row";
  for (let j = 0; j < size; j++) {
    const header = document.createElement("div");
    header.className = "matrix-header-cell";
    header.textContent = `a${j}`;
    headerRow.appendChild(header);
  }
  const bHeader = document.createElement("div");
  bHeader.className = "matrix-header-cell";
  bHeader.textContent = "b";
  headerRow.appendChild(bHeader);
  container.appendChild(headerRow);

  for (let i = 0; i < size; i++) {
    const row = document.createElement("div");
    row.className = "matrix-row";

    for (let j = 0; j <= size; j++) {
      const input = document.createElement("input");
      input.type = "number";
      input.id = `a-${i}-${j}`;
      input.placeholder = j === size ? "b" : `a${i}${j}`;
      input.step = "0.01";
      row.appendChild(input);
    }

    container.appendChild(row);
  }

  const sampleMatrix = [
    [3, 2, -1, 1],
    [2, -2, 4, -2],
    [-1, 4, -2, -3],
  ];

  for (let i = 0; i < Math.min(size, 3); i++) {
    for (let j = 0; j <= size; j++) {
      if (j < sampleMatrix[i].length) {
        document.getElementById(`a-${i}-${j}`).value = sampleMatrix[i][j];
      }
    }
  }
}

// fillLinearExampleData: populate the linear system solver with a sample matrix
function fillLinearExampleData() {
  document.getElementById("matrix-size").value = "3";
  generateMatrixInputs();
}

// getMatrixFromInputs: read the current matrix and RHS values from input fields
function getMatrixFromInputs() {
  const size = parseInt(document.getElementById("matrix-size").value);
  const A = [];
  const b = [];

  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      const val = parseFloat(document.getElementById(`a-${i}-${j}`).value) || 0;
      if (isNaN(val))
        throw new Error("Invalid matrix value at (" + i + "," + j + ")");
      row.push(val);
    }
    A.push(row);
    const bVal =
      parseFloat(document.getElementById(`a-${i}-${size}`).value) || 0;
    if (isNaN(bVal)) throw new Error("Invalid b value at row " + i);
    b.push(bVal);
  }

  return {
    A: A.map((r) => [...r]),
    b: [...b],
    A_orig: A.map((r) => [...r]),
  };
}

// backSubstitution: solve an upper-triangular system Ux = b by backward substitution
function backSubstitution(A, b) {
  const n = b.length;
  const x = new Array(n);

  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= A[i][j] * x[j];
    }
    if (Math.abs(A[i][i]) < 1e-10)
      throw new Error("Matrix is singular or near-singular");
    x[i] /= A[i][i];
  }

  return x;
}

// gaussianElimination: perform forward elimination without pivoting and then back-substitution
function gaussianElimination(A, b) {
  const n = A.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][i]) < 1e-10) throw new Error("Zero pivot encountered");
      const multiplier = A[j][i] / A[i][i];

      for (let k = i; k < n; k++) {
        A[j][k] -= multiplier * A[i][k];
      }
      b[j] -= multiplier * b[i];
    }
  }

  const x = backSubstitution(A, b);
  return { x };
}

// gaussianEliminationPP: Gaussian elimination with partial pivoting for numerical stability
function gaussianEliminationPP(A, b) {
  const n = A.length;

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    if (maxRow !== i) {
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
    }

    if (Math.abs(A[i][i]) < 1e-10) throw new Error("Zero pivot encountered");

    for (let j = i + 1; j < n; j++) {
      const multiplier = A[j][i] / A[i][i];
      for (let k = i; k < n; k++) {
        A[j][k] -= multiplier * A[i][k];
      }
      b[j] -= multiplier * b[i];
    }
  }

  const x = backSubstitution(A, b);
  return { x };
}

// gaussJordanElimination: solve the linear system by reducing the augmented matrix to reduced row echelon form
function gaussJordanElimination(A, b) {
  const n = A.length;

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    if (Math.abs(A[i][i]) < 1e-10) throw new Error("Zero pivot encountered");

    const pivot = A[i][i];
    for (let j = 0; j < n; j++) {
      A[i][j] /= pivot;
    }
    b[i] /= pivot;

    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = A[j][i];
        for (let k = 0; k < n; k++) {
          A[j][k] -= factor * A[i][k];
        }
        b[j] -= factor * b[i];
      }
    }
  }

  return b;
}

// luDecomposition: factor A into L and U matrices for efficient linear solves
function luDecomposition(A) {
  const n = A.length;
  const L = Array(n)
    .fill()
    .map(() => Array(n).fill(0));
  const U = Array(n)
    .fill()
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      U[i][j] = A[i][j];
      for (let k = 0; k < i; k++) {
        U[i][j] -= L[i][k] * U[k][j];
      }
    }

    for (let j = i; j < n; j++) {
      if (i === j) {
        L[i][j] = 1;
      } else {
        L[j][i] = A[j][i];
        for (let k = 0; k < i; k++) {
          L[j][i] -= L[j][k] * U[k][i];
        }
        if (Math.abs(U[i][i]) < 1e-10)
          throw new Error("Zero pivot in LU decomposition");
        L[j][i] /= U[i][i];
      }
    }
  }

  return { L, U };
}

// forwardSubstitution: solve Ly = b for lower-triangular L by forward substitution
function forwardSubstitution(L, b) {
  const n = b.length;
  const y = new Array(n);

  for (let i = 0; i < n; i++) {
    y[i] = b[i];
    for (let j = 0; j < i; j++) {
      y[i] -= L[i][j] * y[j];
    }
    y[i] /= L[i][i];
  }

  return y;
}

// determinant: compute matrix determinant recursively by expansion of minors
function determinant(matrix) {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let det = 0;
  for (let i = 0; i < n; i++) {
    const subMatrix = matrix
      .slice(1)
      .map((row) => row.filter((_, j) => j !== i));
    det += (i % 2 === 0 ? 1 : -1) * matrix[0][i] * determinant(subMatrix);
  }
  return det;
}

// cramersRule: compute solution to Ax=b using determinants for each variable
function cramersRule(A, b) {
  const det_A = determinant(A);
  if (Math.abs(det_A) < 1e-10)
    throw new Error("Matrix is singular - Cramer's rule cannot be applied");

  const x = new Array(b.length);
  for (let i = 0; i < b.length; i++) {
    const Ai = A.map((row, idx) =>
      row.map((val, jdx) => (jdx === i ? b[idx] : val)),
    );
    x[i] = determinant(Ai) / det_A;
  }

  return x;
}

// solveLinearSystem: dispatch the selected linear solver and render the solution
function solveLinearSystem() {
  try {
    const method = document.getElementById("linear-method").value;
    const { A, b, A_orig } = getMatrixFromInputs();
    const n = A.length;
    const resultsDiv = document.getElementById("linear-results");

    let result,
      html = "";

    if (method === "gaussian") {
      result = gaussianElimination(A, b);
      const x = result.x;

      html = `<div class="result-item success"><strong>✅ Solution (Gaussian Elimination):</strong></div>`;
      for (let i = 0; i < x.length; i++) {
        html += `<div class="result-item">x${i + 1} = ${x[i].toFixed(8)}</div>`;
      }
      html +=
        '<div class="result-item"><strong>📋 Verification:</strong><table><tr><th>Eq</th><th>Computed</th><th>Expected</th><th>Error</th></tr>';
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) sum += A_orig[i][j] * x[j];
        html += `<tr><td>${i + 1}</td><td>${sum.toFixed(6)}</td><td>${b[i].toFixed(6)}</td><td>${Math.abs(sum - b[i]).toFixed(8)}</td></tr>`;
      }
      html += "</table></div>";
    } else if (method === "gaussian-pp") {
      result = gaussianEliminationPP(A, b);
      const x = result.x;

      html = `<div class="result-item success"><strong>✅ Solution (Gaussian - Partial Pivoting):</strong></div>`;
      for (let i = 0; i < x.length; i++) {
        html += `<div class="result-item">x${i + 1} = ${x[i].toFixed(8)}</div>`;
      }
      html +=
        '<div class="result-item"><strong>📋 Verification:</strong><table><tr><th>Eq</th><th>Computed</th><th>Expected</th><th>Error</th></tr>';
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) sum += A_orig[i][j] * x[j];
        html += `<tr><td>${i + 1}</td><td>${sum.toFixed(6)}</td><td>${b[i].toFixed(6)}</td><td>${Math.abs(sum - b[i]).toFixed(8)}</td></tr>`;
      }
      html += "</table></div>";
    } else if (method === "gauss-jordan") {
      const x = gaussJordanElimination(A, b);

      html = `<div class="result-item success"><strong>✅ Solution (Gauss-Jordan):</strong></div>`;
      for (let i = 0; i < x.length; i++) {
        html += `<div class="result-item">x${i + 1} = ${x[i].toFixed(8)}</div>`;
      }
      html +=
        '<div class="result-item"><strong>📋 Verification:</strong><table><tr><th>Eq</th><th>Computed</th><th>Expected</th><th>Error</th></tr>';
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) sum += A_orig[i][j] * x[j];
        html += `<tr><td>${i + 1}</td><td>${sum.toFixed(6)}</td><td>${b[i].toFixed(6)}</td><td>${Math.abs(sum - b[i]).toFixed(8)}</td></tr>`;
      }
      html += "</table></div>";
    } else if (method === "lu") {
      const { L, U } = luDecomposition(A_orig);
      const y = forwardSubstitution(L, b);
      const x = backSubstitution(U, y);

      html = `<div class="result-item success"><strong>✅ LU Decomposition:</strong></div>
                            <div class="result-item"><strong>L Matrix:</strong><table>`;
      for (let i = 0; i < n; i++) {
        html += "<tr>";
        for (let j = 0; j < n; j++) html += `<td>${L[i][j].toFixed(6)}</td>`;
        html += "</tr>";
      }
      html += `</table></div><div class="result-item"><strong>U Matrix:</strong><table>`;
      for (let i = 0; i < n; i++) {
        html += "<tr>";
        for (let j = 0; j < n; j++) html += `<td>${U[i][j].toFixed(6)}</td>`;
        html += "</tr>";
      }
      html += `</table></div><div class="result-item success"><strong>✅ Solution:</strong></div>`;
      for (let i = 0; i < x.length; i++)
        html += `<div class="result-item">x${i + 1} = ${x[i].toFixed(8)}</div>`;
    } else if (method === "cramer") {
      const x = cramersRule(A_orig, b);

      html = `<div class="result-item success"><strong>✅ Solution (Cramer's Rule):</strong></div>`;
      for (let i = 0; i < x.length; i++) {
        html += `<div class="result-item">x${i + 1} = ${x[i].toFixed(8)}</div>`;
      }
      html +=
        '<div class="result-item"><strong>📋 Verification:</strong><table><tr><th>Eq</th><th>Computed</th><th>Expected</th><th>Error</th></tr>';
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) sum += A_orig[i][j] * x[j];
        html += `<tr><td>${i + 1}</td><td>${sum.toFixed(6)}</td><td>${b[i].toFixed(6)}</td><td>${Math.abs(sum - b[i]).toFixed(8)}</td></tr>`;
      }
      html += "</table></div>";
    }

    resultsDiv.innerHTML = html;
    resultsDiv.classList.add("show");
  } catch (error) {
    alert("❌ ERROR:\n\n" + error.message);
  }
}

// clearLinearResults: remove linear solver output from the results container
function clearLinearResults() {
  const size = parseInt(document.getElementById("matrix-size").value);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size; j++) {
      document.getElementById(`a-${i}-${j}`).value = "";
    }
  }

  document.getElementById("linear-results").innerHTML = "";
}

// goldenSectionSearch: perform a 1D optimization using golden-section interval reduction
function goldenSectionSearch(f, xl, xu, tol, maxIter, findMax, decimalPlaces) {
  const R = (Math.sqrt(5) - 1) / 2; // ≈ 0.61803
  const iterations = [];

  for (let i = 0; i < maxIter; i++) {
    const d = R * (xu - xl);
    const x1 = xl + d; // upper interior point
    const x2 = xu - d; // lower interior point
    const fx1 = f(x1);
    const fx2 = f(x2);

    // Current best estimate
    const xOpt = findMax ? (fx1 > fx2 ? x1 : x2) : fx1 < fx2 ? x1 : x2;
    const fxOpt = f(xOpt);

    // Relative error based on interval width
    const error = i === 0 ? 100 : Math.abs((xu - xl) / xOpt) * 100;

    const eliminate = findMax
      ? fx1 > fx2
        ? `f(x1) > f(x2) → keep [x2, xu], new xl = x2 = ${x2.toFixed(decimalPlaces)}`
        : `f(x2) >= f(x1) → keep [xl, x1], new xu = x1 = ${x1.toFixed(decimalPlaces)}`
      : fx1 < fx2
        ? `f(x1) < f(x2) → keep [xl, x1], new xu = x1 = ${x1.toFixed(decimalPlaces)}`
        : `f(x2) <= f(x1) → keep [x2, xu], new xl = x2 = ${x2.toFixed(decimalPlaces)}`;

    const stepDetails =
      `d = R*(xu-xl) = 0.61803*(${xu.toFixed(decimalPlaces)}-${xl.toFixed(decimalPlaces)}) = ${d.toFixed(decimalPlaces)}\n` +
      `x1 = xl + d = ${x1.toFixed(decimalPlaces)},  f(x1) = ${fx1.toFixed(decimalPlaces)}\n` +
      `x2 = xu - d = ${x2.toFixed(decimalPlaces)},  f(x2) = ${fx2.toFixed(decimalPlaces)}\n` +
      `${eliminate}\n` +
      `Current best: x* = ${xOpt.toFixed(decimalPlaces)},  f(x*) = ${fxOpt.toFixed(decimalPlaces)}`;

    iterations.push({
      iteration: i + 1,
      xl,
      xu,
      x1,
      x2,
      fx1,
      fx2,
      xOpt,
      fxOpt,
      d,
      error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (i > 0 && error < tol) break;

    // Narrow the interval correctly
    if (findMax) {
      if (fx1 > fx2) {
        xl = x2;
      } else {
        xu = x1;
      }
    } else {
      if (fx1 < fx2) {
        xu = x1;
      } else {
        xl = x2;
      }
    }
  }

  const last = iterations[iterations.length - 1];
  return { xOpt: last.xOpt, fOpt: last.fxOpt, iterations };
}

// partialX: approximate the partial derivative ∂f/∂x using central difference
function partialX(f, x, y, h = 1e-7) {
  return (f(x + h, y) - f(x - h, y)) / (2 * h);
}
// partialY: approximate the partial derivative ∂f/∂y using central difference
function partialY(f, x, y, h = 1e-7) {
  return (f(x, y + h) - f(x, y - h)) / (2 * h);
}
// partialXX: approximate the second partial derivative ∂²f/∂x² by finite difference
function partialXX(f, x, y, h = 1e-5) {
  return (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
}
// partialYY: approximate the second partial derivative ∂²f/∂y² by finite difference
function partialYY(f, x, y, h = 1e-5) {
  return (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
}
// partialXY: approximate the mixed second partial derivative ∂²f/∂x∂y
function partialXY(f, x, y, h = 1e-5) {
  return (
    (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) /
    (4 * h * h)
  );
}

// steepestMethod: perform steepest ascent/descent using gradient direction and line search
function steepestMethod(f, x0, y0, tol, maxIter, findMax, decimalPlaces) {
  const iterations = [];
  let x = x0,
    y = y0;
  const sign = findMax ? 1 : -1;

  for (let i = 0; i < maxIter; i++) {
    const fx = f(x, y);
    const gx = partialX(f, x, y);
    const gy = partialY(f, x, y);
    const gradMag = Math.sqrt(gx * gx + gy * gy);

    if (gradMag < 1e-12) break;

    // Line search along gradient direction using golden section
    const lineFunc = (h) => f(x + sign * gx * h, y + sign * gy * h);
    let hOpt = 0;
    let lh = 0,
      uh = 1.0;
    const R = (Math.sqrt(5) - 1) / 2;
    for (let k = 0; k < 50; k++) {
      const d = R * (uh - lh);
      const h1 = lh + d,
        h2 = uh - d;
      if (lineFunc(h1) > lineFunc(h2)) {
        uh = h1;
      } else {
        lh = h2;
      }
      if (Math.abs(uh - lh) < 1e-10) break;
    }
    hOpt = (lh + uh) / 2;

    const xNew = x + sign * gx * hOpt;
    const yNew = y + sign * gy * hOpt;
    const fNew = f(xNew, yNew);

    const error =
      i === 0
        ? 100
        : (Math.sqrt((xNew - x) ** 2 + (yNew - y) ** 2) /
            Math.sqrt(xNew ** 2 + yNew ** 2)) *
          100;

    const stepDetails =
      `∂f/∂x = ${gx.toFixed(decimalPlaces)},  ∂f/∂y = ${gy.toFixed(decimalPlaces)}\n` +
      `Gradient magnitude = ${gradMag.toFixed(decimalPlaces)}\n` +
      `Optimal step h* = ${hOpt.toFixed(decimalPlaces)}\n` +
      `New point: (${xNew.toFixed(decimalPlaces)}, ${yNew.toFixed(decimalPlaces)})\n` +
      `f(new) = ${fNew.toFixed(decimalPlaces)}`;

    iterations.push({
      iteration: i + 1,
      x,
      y,
      fx,
      gx,
      gy,
      gradMag,
      hOpt,
      xNew,
      yNew,
      fNew,
      error,
      steps: stepDetails,
      errorPercent: error,
    });

    if (i > 0 && error < tol) break;

    x = xNew;
    y = yNew;
  }

  const last = iterations[iterations.length - 1];
  return { xOpt: last.xNew, yOpt: last.yNew, fOpt: last.fNew, iterations };
}

// updateOptMethodUI: switch optimization UI inputs based on selected method
function updateOptMethodUI() {
  const method = document.getElementById("opt-method").value;
  document.getElementById("golden-inputs").style.display = "none";
  document.getElementById("steepest-inputs").style.display = "none";

  const ruleBox = document.getElementById("opt-method-rule");
  const optRules = {
    "golden-section":
      "📌 <strong>Golden-Section Search:</strong> Finds the maximum or minimum of a unimodal 1D function within a bracketing interval [xl, xu]. Uses the golden ratio to pick two interior points and eliminates portions of the interval that cannot contain the optimum.<br><br>📋 <strong>Rule:</strong><br>d = R × (xu − xl),  R = (√5 − 1) / 2 ≈ 0.61803<br>x1 = xl + d,  x2 = xu − d",
    "steepest-ascent":
      "📌 <strong>Steepest Ascent/Descent:</strong> Gradient-based 2D optimization. At each step the gradient ∇f is computed; a 1D line search along that direction finds the optimal step size h*. The process repeats until the gradient magnitude is near zero.<br><br>📋 <strong>Rule:</strong><br>x<sub>new</sub> = x + (∂f/∂x) · h*<br>y<sub>new</sub> = y + (∂f/∂y) · h*",
  };
  ruleBox.innerHTML = optRules[method] || "";
  ruleBox.classList.add("show");

  const testExamples = {
    "golden-section":
      "<strong>✅ Test Example:</strong> <code>f(x): 2*sin(x) - x^2/10</code> &nbsp; <code>xl: 0</code> &nbsp; <code>xu: 4</code> &nbsp; (maximize)",
    "steepest-ascent":
      "<strong>✅ Test Example:</strong> <code>f(x,y): 2*x*y + 2*x - x^2 - 2*y^2</code> &nbsp; <code>x₀: -1</code> &nbsp; <code>y₀: 1</code> &nbsp; (maximize)",
  };
  const exampleButtonHtml = `
    <div class="example-button-wrap">
      <button class="btn-example" onclick="fillOptExampleData()">
        Use this example
      </button>
    </div>`;
  document.getElementById("opt-test-example").innerHTML =
    `${testExamples[method] || ""}${exampleButtonHtml}`;

  if (method === "golden-section") {
    document.getElementById("golden-inputs").style.display = "block";
  } else if (method === "steepest-ascent") {
    document.getElementById("steepest-inputs").style.display = "block";
  }
}

// fillOptExampleData: populate example inputs for the optimization tab
function fillOptExampleData() {
  const method = document.getElementById("opt-method").value;
  const examples = {
    "golden-section": {
      func: "2*sin(x) - x^2/10",
      xl: 0,
      xu: 4,
      goal: "max",
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 6,
    },
    "steepest-ascent": {
      func: "2*x*y + 2*x - x^2 - 2*y^2",
      x0: -1,
      y0: 1,
      goal: "max",
      tol: 0.1,
      maxIter: 50,
      decimalPlaces: 6,
    },
  };

  const example = examples[method];
  if (!example) return;

  document.getElementById("opt-tol").value = example.tol;
  document.getElementById("opt-max-iter").value = example.maxIter;
  document.getElementById("opt-decimal-places").value = example.decimalPlaces;

  if (method === "golden-section") {
    document.getElementById("golden-func").value = example.func;
    document.getElementById("golden-xl").value = example.xl;
    document.getElementById("golden-xu").value = example.xu;
    document.getElementById("golden-goal").value = example.goal;
  }

  if (method === "steepest-ascent") {
    document.getElementById("steepest-func").value = example.func;
    document.getElementById("steepest-x0").value = example.x0;
    document.getElementById("steepest-y0").value = example.y0;
    document.getElementById("steepest-goal").value = example.goal;
  }
}

// createFunction2D: convert a 2D expression string into a callable function f(x,y)
function createFunction2D(expr) {
  if (!expr || typeof expr !== "string")
    throw new Error("Expression must be a non-empty string");
  let processed = expr
    .trim()
    .replace(/\^/g, "**")
    .replace(/(\d)(\s*)x\b/g, "$1$2*x")
    .replace(/(\d)(\s*)y\b/g, "$1$2*y")
    .replace(/x(\s*)y/g, "x$1*y")
    .replace(/y(\s*)x/g, "y$1*x")
    .replace(/\)\s*\(/g, ")*(")
    .replace(/x\s*\(/g, "x*(")
    .replace(/y\s*\(/g, "y*(")
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\bsin\(/g, "Math.sin(")
    .replace(/\bcos\(/g, "Math.cos(")
    .replace(/\btan\(/g, "Math.tan(")
    .replace(/\bexp\(/g, "Math.exp(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/\babs\(/g, "Math.abs(");
  try {
    const func = new Function("x", "y", `return ${processed}`);
    func(1, 1); // test
    return func;
  } catch (e) {
    throw new Error(`Invalid 2D expression: "${expr}"\n${e.message}`);
  }
}

// solveOptimization: execute the chosen optimization method and show the solution
function solveOptimization() {
  try {
    const method = document.getElementById("opt-method").value;
    const tol = parseFloat(document.getElementById("opt-tol").value);
    const maxIter = parseInt(document.getElementById("opt-max-iter").value);
    const decimalPlaces =
      parseInt(document.getElementById("opt-decimal-places").value) || 6;
    const resultsDiv = document.getElementById("opt-results");

    if (isNaN(tol) || isNaN(maxIter))
      throw new Error("Invalid tolerance or max iterations");

    let result,
      html = "";

    if (method === "golden-section") {
      const funcStr = document.getElementById("golden-func").value.trim();
      const xl = parseFloat(document.getElementById("golden-xl").value);
      const xu = parseFloat(document.getElementById("golden-xu").value);
      const findMax = document.getElementById("golden-goal").value === "max";

      if (!funcStr) throw new Error("Please enter a function f(x)");
      if (isNaN(xl) || isNaN(xu)) throw new Error("Invalid interval values");
      if (xl >= xu) throw new Error("xl must be less than xu");

      const f = createFunction(funcStr);
      result = goldenSectionSearch(
        f,
        xl,
        xu,
        tol,
        maxIter,
        findMax,
        decimalPlaces,
      );

      html = `
        <div class="result-item success">
          <strong>✅ Optimal x Found: ${result.xOpt.toFixed(decimalPlaces)}</strong>
          f(x*) = ${result.fOpt.toFixed(decimalPlaces)}
        </div>
        <div class="result-item">
          <strong>🎯 Goal: ${findMax ? "Maximize" : "Minimize"}</strong>
          Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})
        </div>
      `;

      if (result.iterations.length > 0) {
        html +=
          "<table><tr><th>Iter</th><th>xl</th><th>xu</th><th>x2</th><th>f(x2)</th><th>x1</th><th>f(x1)</th><th>x*</th><th>f(x*)</th><th>Error(%)</th></tr>";
        result.iterations.forEach((it) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'>
            <td>${it.iteration}</td>
            <td>${it.xl.toFixed(decimalPlaces)}</td>
            <td>${it.xu.toFixed(decimalPlaces)}</td>
            <td>${it.x2.toFixed(decimalPlaces)}</td>
            <td>${it.fx2.toFixed(decimalPlaces)}</td>
            <td>${it.x1.toFixed(decimalPlaces)}</td>
            <td>${it.fx1.toFixed(decimalPlaces)}</td>
            <td>${it.xOpt.toFixed(decimalPlaces)}</td>
            <td>${it.fxOpt.toFixed(decimalPlaces)}</td>
            <td>${it.error.toFixed(decimalPlaces)}</td>
          </tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
      resultsDiv.classList.add("show");
    } else if (method === "steepest-ascent") {
      const funcStr = document.getElementById("steepest-func").value.trim();
      const x0 = parseFloat(document.getElementById("steepest-x0").value);
      const y0 = parseFloat(document.getElementById("steepest-y0").value);
      const findMax = document.getElementById("steepest-goal").value === "max";

      if (!funcStr) throw new Error("Please enter a function f(x,y)");
      if (isNaN(x0) || isNaN(y0))
        throw new Error("Invalid starting point values");

      const f = createFunction2D(funcStr);

      // Evaluate Hessian at starting point for classification info
      const hxx = partialXX(f, x0, y0);
      const hyy = partialYY(f, x0, y0);
      const hxy = partialXY(f, x0, y0);
      const hDet = hxx * hyy - hxy * hxy;
      let hessianInfo = "";
      if (hDet > 0 && hxx > 0)
        hessianInfo = "✅ Starting point region: Local minimum likely";
      else if (hDet > 0 && hxx < 0)
        hessianInfo = "✅ Starting point region: Local maximum likely";
      else if (hDet < 0)
        hessianInfo = "⚠️ Starting point is near a saddle point";
      else hessianInfo = "ℹ️ Inconclusive (|H| = 0)";

      result = steepestMethod(f, x0, y0, tol, maxIter, findMax, decimalPlaces);

      // Check Hessian at final point
      const fxx = partialXX(f, result.xOpt, result.yOpt);
      const fyy = partialYY(f, result.xOpt, result.yOpt);
      const fxy = partialXY(f, result.xOpt, result.yOpt);
      const hessianDet = fxx * fyy - fxy * fxy;
      let optType = "";
      if (hessianDet > 0 && fxx < 0)
        optType = "✅ Local Maximum confirmed (|H|>0, fxx<0)";
      else if (hessianDet > 0 && fxx > 0)
        optType = "✅ Local Minimum confirmed (|H|>0, fxx>0)";
      else if (hessianDet < 0) optType = "⚠️ Saddle Point (|H|<0)";
      else optType = "ℹ️ Inconclusive";

      html = `
        <div class="result-item success">
          <strong>✅ Optimal Point Found</strong>
          x* = ${result.xOpt.toFixed(decimalPlaces)},  y* = ${result.yOpt.toFixed(decimalPlaces)}
        </div>
        <div class="result-item">
          <strong>📊 f(x*, y*) = ${result.fOpt.toFixed(decimalPlaces)}</strong>
        </div>
        <div class="result-item">
          <strong>🔍 Hessian Analysis at Optimum:</strong><br>
          fxx = ${fxx.toFixed(decimalPlaces)},  fyy = ${fyy.toFixed(decimalPlaces)},  fxy = ${fxy.toFixed(decimalPlaces)}<br>
          |H| = ${hessianDet.toFixed(decimalPlaces)}<br>
          ${optType}
        </div>
        <div class="result-item">
          <strong>🔄 Solved in <strong>${result.iterations.length}</strong> iterations (Maximum allowed: ${maxIter})</strong>
          &nbsp;|&nbsp; Goal: ${findMax ? "Maximize" : "Minimize"}
        </div>
      `;

      if (result.iterations.length > 0) {
        html +=
          "<table><tr><th>Iter</th><th>x</th><th>y</th><th>f(x,y)</th><th>∂f/∂x</th><th>∂f/∂y</th><th>h*</th><th>x_new</th><th>y_new</th><th>Error(%)</th></tr>";
        result.iterations.forEach((it) => {
          html += `<tr class='iteration-row' onclick='expandIterationRow(this, ${JSON.stringify(it).replace(/'/g, "\\'")})'>
            <td>${it.iteration}</td>
            <td>${it.x.toFixed(decimalPlaces)}</td>
            <td>${it.y.toFixed(decimalPlaces)}</td>
            <td>${it.fx.toFixed(decimalPlaces)}</td>
            <td>${it.gx.toFixed(decimalPlaces)}</td>
            <td>${it.gy.toFixed(decimalPlaces)}</td>
            <td>${it.hOpt.toFixed(decimalPlaces)}</td>
            <td>${it.xNew.toFixed(decimalPlaces)}</td>
            <td>${it.yNew.toFixed(decimalPlaces)}</td>
            <td>${it.error.toFixed(decimalPlaces)}</td>
          </tr>`;
        });
        html += "</table>";
      }

      resultsDiv.innerHTML = html;
      resultsDiv.classList.add("show");
    }
  } catch (error) {
    alert("❌ ERROR:\n\n" + error.message);
  }
}

// clearOptResults: reset optimization inputs and clear output display
function clearOptResults() {
  document.getElementById("opt-method").value = "golden-section";
  document.getElementById("opt-tol").value = "";
  document.getElementById("opt-max-iter").value = "50";
  document.getElementById("opt-decimal-places").value = "6";
  document.getElementById("golden-func").value = "";
  document.getElementById("golden-xl").value = "";
  document.getElementById("golden-xu").value = "";
  document.getElementById("golden-goal").value = "max";
  document.getElementById("steepest-func").value = "";
  document.getElementById("steepest-x0").value = "";
  document.getElementById("steepest-y0").value = "";
  document.getElementById("steepest-goal").value = "max";
  document.getElementById("opt-results").innerHTML = "";
  document.getElementById("opt-results").classList.remove("show");
  updateOptMethodUI();
}

// window.onload: initialize the application state once the page has loaded
window.onload = () => {
  generateMatrixInputs();
  updateRootMethodUI();
  updateOptMethodUI();
};
