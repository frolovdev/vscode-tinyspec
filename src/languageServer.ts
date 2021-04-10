import * as vscode from "vscode";
import { TinyspecDefinitionProvider } from "./providers/DefinitionProvider";
import { TinyspecHoverProvider } from "./providers/HoverProvider";

let defaultLanguageProviders: vscode.Disposable[] = [];
let languageServerDisposable: vscode.Disposable;

export async function startLanguageServerWithFallback(
  ctx: vscode.ExtensionContext,
  activation: boolean
) {
  try {
    const started = await startLanguageServer(ctx);
    registerDefaultProviders(ctx);
  } catch (error) {}
}

async function startLanguageServer(
  ctx: vscode.ExtensionContext
): Promise<boolean> {
  ctx.subscriptions.push(languageServerDisposable);
  return true;
}

const tinyspeclang = [
  { language: "tinyspecmodels", scheme: "file" },
  { language: "tinyspecendpoints", scheme: "file" },
];

// registerUsualProviders registers the language feature providers if the language server is not enabled.
function registerDefaultProviders(ctx: vscode.ExtensionContext) {
  defaultLanguageProviders.push(
    vscode.languages.registerHoverProvider(
      tinyspeclang,
      new TinyspecHoverProvider()
    )
  );

  defaultLanguageProviders.push(
    vscode.languages.registerDefinitionProvider(
      tinyspeclang,
      new TinyspecDefinitionProvider()
    )
  );

  for (const provider of defaultLanguageProviders) {
    ctx.subscriptions.push(provider);
  }
}
