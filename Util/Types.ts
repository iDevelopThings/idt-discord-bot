export type ToCamelCase<T> =
	T extends `${infer A}_${infer B}`
		? `${Uncapitalize<A>}${Capitalize<ToCamelCase<B>>}` :
		T extends string
			? Uncapitalize<T> :
			T extends (infer A)[]
				? ToCamelCase<A>[] :
				T extends {}
					? { [K in keyof T as ToCamelCase<K>]: ToCamelCase<T[K]>; } :
					T;
