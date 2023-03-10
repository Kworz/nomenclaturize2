export type Filter = {
    name: string;
    default?: true;
}

export type FilterCondition = {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | '~' | '!~';
    value: string;
    hidden?: boolean
}

export function convertFilterCondition(value: string, availableFilters: Array<Filter>): FilterCondition
{
    if(value.length === 0)
        throw "Filter length too small";

    const defaultFilter = availableFilters.find(k => k.default === true);
    const regexMatches = value.match(/([\w|.]*) (=|!=|>|<|>=|<=|~|!~) (.*)/);

    if(regexMatches === null)
        if(value.length > 0 && defaultFilter !== undefined)
        {
            return { field: defaultFilter.name, value, operator: "~" };
        }
        else
            throw "Invalid filter"

    if(regexMatches.length !== 4)
        throw "Invalid filter parts length"

    const field = regexMatches[1];
    const operator = regexMatches[2] as FilterCondition["operator"];
    const value2 = regexMatches[3];

    const filterName = validateFilterField(availableFilters, field);

    return {
        field: filterName,
        operator: operator,
        value: value2
    }
}

function validateFilterField(availableFilters: Array<Filter>, possibleField: string): string {

    const possibleFilter = availableFilters.find(k => k.name.includes(possibleField));

    if(possibleFilter === undefined)
        throw `${possibleField} is not a possible filter`;

    return possibleFilter.name;

}

/**
 * Predict Fields filters based on value typed
 * @param value 
 * @param availableFilters 
 * @returns 
 */
export function predictField(value: string, availableFilters: Array<Filter>): string[] {

    if(value.length === 0)
        return [];

    const parts = value.split(" ");
    const part = parts.length - 1;

    if(part === 0)
    {
        const prefixes = availableFilters.filter(k => k.default !== true).map(k => k.name);
        return prefixes.filter(k => k.toLowerCase().includes(parts[0].toLowerCase())).filter(k => k !== parts[0].toLowerCase()).sort((a, b) => a.indexOf(parts[0].toLowerCase()) - b.indexOf(parts[0].toLowerCase()));
    }
    else if (part === 1)
    {
        const operators = ['=' , '~', '!=' , '>' , '<' , '>=', '<=', '!~'].filter(k => k.includes(parts[1]));
        return operators.length === 1 ? [] : operators;
    }
    else
        return [];
}

function convertFilterValue(value: string): string {

    if(value === "true" || value === "false")
        return value;
    
    return `"${value}"`;
}

export function convertToPocketbaseFilter(filters: Array<FilterCondition>): string
{
    // Gather unique fields
    const fields = [...new Set(filters.map(k => k.field))];

    // Recudes fields to be grouped in filter group to prenvent data leaking
    const mappedFilters = fields.map(fieldName => `(${filters.filter(filter => filter.field === fieldName).map(filter => `${filter.field} ${filter.operator} ${convertFilterValue(filter.value)}`).join(" && ")})`);

    return encodeURIComponent(mappedFilters.join(" && "));
}