/** Whether an increase is good: income, and expense categories that are savings (matched by name, since categories can be renamed). */
export const higherIsBetter = (c) => c.type === 'income' || /saving|invest/i.test(c.name)
