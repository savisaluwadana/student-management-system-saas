/**
 * CSV Utilities for Import/Export
 */

export interface CSVParseResult<T> {
    success: boolean;
    data: T[];
    errors: { row: number; message: string }[];
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV<T>(
    csvString: string,
    options: {
        headers?: string[];
        skipFirstRow?: boolean;
        transform?: (row: Record<string, string>) => T;
    } = {}
): CSVParseResult<T> {
    const { headers: customHeaders, skipFirstRow = true, transform } = options;
    const errors: { row: number; message: string }[] = [];
    const data: T[] = [];

    // Split into lines and filter empty ones
    const lines = csvString
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) {
        return { success: false, data: [], errors: [{ row: 0, message: 'Empty CSV file' }] };
    }

    // Get headers from first row or use custom headers
    const headerRow = lines[0];
    const headers = customHeaders || parseCSVLine(headerRow);

    // Start from row 1 if skipping first row (header), or row 0 if using custom headers
    const startRow = skipFirstRow ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};

            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j] || '';
            }

            if (transform) {
                data.push(transform(row));
            } else {
                data.push(row as unknown as T);
            }
        } catch (error: any) {
            errors.push({ row: i + 1, message: error.message });
        }
    }

    return {
        success: errors.length === 0,
        data,
        errors,
    };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, any>>(
    data: T[],
    options: {
        headers?: (keyof T)[];
        headerLabels?: Record<string, string>;
    } = {}
): string {
    if (data.length === 0) {
        return '';
    }

    const headers = options.headers || (Object.keys(data[0]) as (keyof T)[]);
    const headerLabels = options.headerLabels || {};

    // Create header row
    const headerRow = headers
        .map((h) => escapeCSVValue(String(headerLabels[h as string] || h)))
        .join(',');

    // Create data rows
    const dataRows = data.map((item) =>
        headers.map((h) => escapeCSVValue(String(item[h] ?? ''))).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape a value for CSV (wrap in quotes if needed)
 */
function escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Download CSV content as a file
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Student CSV template headers
 */
export const STUDENT_CSV_HEADERS = [
    'student_code',
    'full_name',
    'email',
    'phone',
    'guardian_name',
    'guardian_phone',
    'guardian_email',
    'date_of_birth',
    'address',
    'status',
];

/**
 * Validate student data from CSV
 */
export function validateStudentRow(row: Record<string, string>): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!row.student_code?.trim()) {
        errors.push('Student code is required');
    }

    if (!row.full_name?.trim()) {
        errors.push('Full name is required');
    }

    if (row.email && !isValidEmail(row.email)) {
        errors.push('Invalid email format');
    }

    if (row.guardian_email && !isValidEmail(row.guardian_email)) {
        errors.push('Invalid guardian email format');
    }

    if (row.date_of_birth && !isValidDate(row.date_of_birth)) {
        errors.push('Invalid date of birth format (use YYYY-MM-DD)');
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'graduated'];
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(date: string): boolean {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
}
