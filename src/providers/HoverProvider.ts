import * as vscode from "vscode";
import { Hover } from "vscode";

export class TinyspecHoverProvider implements vscode.HoverProvider {
  public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const hoverTexts = new vscode.MarkdownString();
    const hover = new Hover(hoverTexts);
    return hover;
  }
}