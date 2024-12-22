import ts from "typescript";

export namespace Script {
    export class Prop {
        name: string
        type: string
        value: string

        constructor(name: string, type: string) {
            this.name = name;
            this.type = type;
            this.value = "";
        }
    }

    export class ClassInfo {
        name: string
        file: string
        properties: Prop[]

        constructor(name: string) {
            this.name = name;
            this.properties = [];
        }
    }

    export function parseCode(code: string, superClassName: string): ClassInfo | null {
        let foundClass: ClassInfo | null = null;

        const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.Latest, true);
        ts.forEachChild(sourceFile, (node: ts.Node) => {
            if (!ts.isClassDeclaration(node) || !node.name) {
                return;
            }

            const heritageClauses = node.heritageClauses;
            if (!heritageClauses || heritageClauses.length == 0) {
                return;
            }

            let ok = false;
            for (const clause of heritageClauses) {
                if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
                    continue;
                }

                for (const expr of clause.types) {
                    if (expr.expression.kind !== ts.SyntaxKind.Identifier) {
                        continue;
                    }

                    const exprText = (expr.expression as ts.Identifier).text;
                    if (exprText === superClassName) {
                        ok = true;
                        break;
                    }
                }

                if (ok) {
                    break;
                }
            }

            if (!ok) {
                return;
            }

            let classInfo = new ClassInfo(node.name.text);
            
            node.members.forEach(member => {
                if (!ts.isPropertyDeclaration(member) || !member.name || !ts.isIdentifier(member.name)) {
                    return; 
                }

                if (member.modifiers && !member.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PublicKeyword)) {
                    return;
                }

                if (!member.type) {
                    return;
                }

                let prop = new Prop(member.name.text, member.type.getText());
                classInfo.properties.push(prop);
            });

            foundClass = classInfo;
        });

        return foundClass;
    }
}