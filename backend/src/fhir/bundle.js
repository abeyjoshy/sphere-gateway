export function searchsetBundle(resources, baseUrl) {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: resources.length,
    entry: resources.map((r) => ({
      fullUrl: `${baseUrl}/${r.resourceType}/${r.id}`,
      resource: r,
      search: { mode: "match" },
    })),
  };
}


export function transactionResponseBundle(stored) {
  return {
    resourceType: "Bundle",
    type: "transaction-response",
    entry: stored.map((item) => ({
      response: {
        status: "201 Created",
        location: `${item.resourceType}/${item.fhirId}/_history/1`,
      },
    })),
  };
}