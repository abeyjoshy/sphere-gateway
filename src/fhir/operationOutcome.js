export function operationOutcome(severity, code, diagnostics) {
  return { resourceType: "OperationOutcome", issue: [{ severity, code, diagnostics }] };
}


