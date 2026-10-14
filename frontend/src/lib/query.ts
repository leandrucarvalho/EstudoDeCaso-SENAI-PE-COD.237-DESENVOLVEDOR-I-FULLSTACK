type QueryValue = string | number | boolean | undefined | (string | number)[];

/**
 * Monta a query string (`?a=1&b=2`) ignorando o que não foi informado:
 * a API recusa parâmetro vazio (`position=`) com 400.
 */

export function buildQueryString(params: Record<string, QueryValue>): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined ) continue;

        const text = Array.isArray(value) ? value.join(',') : String(value);
        if (text === '') continue;
        
        search.set(key, text);
    }

    const query = search.toString();
    return query === '' ? '' : `?${query}`;
}