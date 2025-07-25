import assert from 'node:assert'
import database from '../database.ts';

class TimesheetReport {
    monthTimeReport(yearStr: string, monthStr: string) {
        const [year, month] = [parseInt(yearStr), parseInt(monthStr)]

        // days in month
        const daysInMonth = new Date(year, month, 0).getDate();

        const columns = [
            'TRIM(TIMESHEET.CATEGORY) AS CATEGORY',
            'TIPO_ATIVIDADE',
            'ELEMENTO_PEP',
            'DIAGRAMA_REDE',
            'OPERACAO',
            'SUBOPERACAO',
            'PARTICAO',
            'CENTRO_TRABALHO',
            'CENTRO',
            "REPLACE(SUM(TIME_SPENT), '.', ',') AS TOTAL"
        ];
        
        for (let day = 1; day <= daysInMonth; day++) {
            let strDay = day.toString().padStart(2, '0')
            columns.push(
                `REPLACE(SUM(TIME_SPENT) FILTER (WHERE strftime('%d', date) = '${strDay}'), '.', ',') AS '${strDay}'`
            )
        }

        const sql = `
            SELECT
                ${columns.join(',')}
            FROM
                TIMESHEET LEFT OUTER JOIN
                SAP_CAT2_OBJECT ON (
                    SAP_CAT2_OBJECT.ACTIVE = 1 AND TRIM(TIMESHEET.CATEGORY) = SAP_CAT2_OBJECT.CATEGORY
                )
            WHERE
                strftime('%Y-%m', DATE) = '${yearStr}-${monthStr}'
            GROUP BY
                1, 2, 3, 4, 5, 6, 7, 8, 9
            ORDER BY
	            TIMESHEET.DATE, TIMESHEET.ID
            `;

        return database.query(sql);
    }

    factsAndDeliveriesReport() {
        const sql = `
            SELECT
                PRINTF(
                    '%04d-W%02d',
                    STRFTIME('%Y', DATE),
                    STRFTIME('%V', DATE)
                ) AS WEEK,
                CATEGORY,
                CONTEXT,
                RELEVANT_FACTS,
                DELIVERIES
            FROM
                TIMESHEET t
            WHERE
                COALESCE(RELEVANT_FACTS, DELIVERIES) IS NOT NULL
            ORDER BY DATE
        `

        return database.query(sql);
    }
}

export { TimesheetReport }