import JSZip from 'jszip';
import { Converters } from '../utils/Converters';
import { Workbook } from './Workbook';

/**
 * Spreadsheet class contains the workbook and the shared strings of a workbook.
 * If you didn't know, Excel file's strings are stored separately in another
 * file and is referenced by index in the content file. This is probably to
 * reduce filesize caused by repetition of strings.
 */
export class Spreadsheet {
  workbook!: Workbook;
  sharedStrings: string[] = [];

  private constructor() {}

  /**
   * Attempts to load the contents of an Excel file asynchronously and
   * returns it.
   *
   * @param file Excel file to load data from
   * @returns {Promise<Spreadsheet>}
   */
  public static async loadFromFile(file: File): Promise<Spreadsheet> {
    const zip = await JSZip.loadAsync(file);
    const relevantEntries: {
      workbook: JSZip.JSZipObject | undefined;
      sharedStrings: JSZip.JSZipObject | undefined;
      worksheets: JSZip.JSZipObject[];
    } = {
      workbook: undefined,
      sharedStrings: undefined,
      worksheets: [],
    };

    zip.forEach((_, entry) => {
      if (entry.name.endsWith('workbook.xml')) {
        relevantEntries.workbook = entry;
      }
      if (entry.name.endsWith('sharedStrings.xml')) {
        relevantEntries.sharedStrings = entry;
      }
      if (entry.name.includes('/worksheets/') && entry.name.endsWith('.xml')) {
        relevantEntries.worksheets.push(entry);
      }
    });

    const spreadsheet = new Spreadsheet();

    const sharedStringsDocument = await Converters.jsZipObjectToDocument(relevantEntries.sharedStrings!);
    spreadsheet.sharedStrings = Array.from(sharedStringsDocument.querySelectorAll('t')).map((el) => el.innerHTML);

    const workbookDocument = await Converters.jsZipObjectToDocument(relevantEntries.workbook!);
    spreadsheet.workbook = await Workbook.loadAsync(spreadsheet, workbookDocument, relevantEntries.worksheets);

    return spreadsheet;
  }
}
