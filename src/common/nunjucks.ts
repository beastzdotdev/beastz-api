import nunjucks from 'nunjucks';

export function setupNunjucksFilters(nunjuckMainRenderer: nunjucks.Environment) {
  nunjuckMainRenderer.addFilter('log', function (value?: unknown): void {
    console.log(value);
  });

  nunjuckMainRenderer.addFilter('json', function (value?: unknown): string {
    return JSON.stringify(value);
  });
}
