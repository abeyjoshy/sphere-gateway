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