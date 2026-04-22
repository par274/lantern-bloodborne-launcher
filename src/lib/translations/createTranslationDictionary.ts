export type TranslationTree = {
    readonly [key: string]: string | TranslationTree;
};

type JoinKey<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`;
type ResolveKey<Prefix extends string, Key extends string> = Key extends '$' ? Prefix : JoinKey<Prefix, Key>;

type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (
    value: infer Intersection
) => void
    ? Intersection
    : never;

export type FlattenTranslationTree<Tree extends TranslationTree, Prefix extends string = ''> = UnionToIntersection<
    {
        [Key in keyof Tree & string]: Tree[Key] extends string
            ? { [FlatKey in ResolveKey<Prefix, Key>]: string }
            : Tree[Key] extends TranslationTree
              ? FlattenTranslationTree<Tree[Key], JoinKey<Prefix, Key>>
              : never;
    }[keyof Tree & string]
>;

function flattenTranslationTree(tree: TranslationTree, prefix = '', output: Record<string, string> = {}): Record<string, string> {
    for (const [key, value] of Object.entries(tree)) {
        const nextKey = key === '$' ? prefix : prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string') {
            if (nextKey) {
                output[nextKey] = value;
            }
            continue;
        }

        flattenTranslationTree(value, nextKey, output);
    }

    return output;
}

export function createTranslationDictionary<const Tree extends TranslationTree>(
    tree: Tree
): FlattenTranslationTree<Tree> {
    return flattenTranslationTree(tree) as FlattenTranslationTree<Tree>;
}
