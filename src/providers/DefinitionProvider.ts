import * as vscode from "vscode";
import { Definition } from "vscode";

export class TinyspecDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const adjustedPos = adjustWordPosition(document, position);

    if (!adjustedPos[0]) {
      return null;
    }
    const word = adjustedPos[1];

    const promise: Promise<{
      location?: vscode.Location;
      searchCompleted: boolean;
    }> = new Promise((resolve, reject) => {
      const searchCompletePromise: Thenable<vscode.TextSearchComplete> = vscode.workspace.findTextInFiles(
        {
          pattern: `\\s*(${word})\\s*(!)?\\s*(\\{|\\()`,
          isRegExp: true,
          isWordMatch: true,
        },
        (result) => {
          if (!result) {
            return reject({ searchCompleted: true });
          }
          // @ts-ignore
          const location = new vscode.Location(result.uri, result.ranges[0]);

          return resolve({ location, searchCompleted: true });
        }
      );

      searchCompletePromise.then(() => {
        return resolve({ searchCompleted: true });
      });
    });

    try {
      const { location, searchCompleted } = await promise;

      if (!location && searchCompleted) {
        throw new Error();
      }

      return location;
    } catch (error) {
      vscode.window.showInformationMessage(
        `Cannot find the declaration of ${word} for the current workspace`
      );
    }
  }
}

// private

function adjustWordPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): [boolean, string | null, vscode.Position | null] {
  const wordRange = document.getWordRangeAtPosition(position);
  const lineText = document.lineAt(position.line).text;
  const word = wordRange ? document.getText(wordRange) : "";

  if (
    !wordRange ||
    lineText.startsWith("//") ||
    lineText.startsWith("#") ||
    isPositionInString(document, position) ||
    isPositionInUrl(document, position) ||
    isPositionInEnum(document, position) ||
    word.match(/^\d+.?\d+$/) ||
    tinyspecEndpointKeywords.includes(word) ||
    tinyspecTypesKeywords.includes(word)
  ) {
    return [false, null, null];
  }
  if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
    position = position.translate(0, -1);
  }

  return [true, word, position];
}

const tinyspecEndpointKeywords: string[] = [
  "get",
  "post",
  "put",
  "patch",
  "update",
  "delete",
  "head",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "UPDATE",
  "DELETE",
  "HEAD",
];

const tinyspecTypesKeywords = [
  "f",
  "i",
  "s",
  "b",
  "d",
  "o",
  "t",
  "j",
  "integer",
  "string",
  "boolean",
  "object",
  "float",
  "date",
  "datetime",
  "text",
  "json",
];

function isPositionInString(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const lineText = document.lineAt(position.line).text;
  const lineTillCurrentPosition = lineText.substr(0, position.character);

  // Count the number of double quotes in the line till current position. Ignore escaped double quotes
  let doubleQuotesCnt = (lineTillCurrentPosition.match(/"/g) || []).length;
  const escapedDoubleQuotesCnt = (lineTillCurrentPosition.match(/\\"/g) || [])
    .length;

  doubleQuotesCnt -= escapedDoubleQuotesCnt;
  return doubleQuotesCnt % 2 === 1;
}

function isPositionInUrl(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const lineText = document.lineAt(position.line).text;
  const lineTillCurrentPosition = lineText.substr(0, position.character);

  let slashCount = (lineTillCurrentPosition.match(/\//g) || []).length;

  if (slashCount === 0) {
    return false;
  }

  let firstWord = lineText.substr(0, lineText.indexOf(" "));

  if (tinyspecEndpointKeywords.includes(firstWord) && slashCount > 0) {
    return true;
  }

  return false;
}

function isPositionInEnum(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const previousLineText = document.lineAt(position.line - 1).text;
  const currentLienText = document.lineAt(position.line).text;

  const enumSeparator = "|";

  return (
    currentLienText.includes(enumSeparator) ||
    previousLineText.includes(enumSeparator)
  );
}
