import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Clusters, NestedClusters } from './clusters';

describe('Clusters', () => {
    test('should initialize empty', () => {
        const clusters = new Clusters((item) => item.category);
        assert.deepStrictEqual(clusters.getClusters(), []);
        assert.deepStrictEqual(clusters.getItems(), []);
    });

    test('addItem should add and group correctly', () => {
        const clusters = new Clusters((item) => item.category);

        clusters.addItem({ id: 1, category: 'A', name: 'Task 1' });
        assert.strictEqual(clusters.getClusters().length, 1);
        assert.strictEqual(clusters.getClusters()[0].items.length, 1);

        // Add to same category
        clusters.addItem({ id: 2, category: 'A', name: 'Task 2' });
        assert.strictEqual(clusters.getClusters().length, 1);
        assert.strictEqual(clusters.getClusters()[0].items.length, 2);

        // Add to different category, check sorting
        clusters.addItem({ id: 3, category: 'B', name: 'Task 3' });

        const groups = clusters.getClusters();
        assert.strictEqual(groups.length, 2);
        // Sorted by key descending
        assert.strictEqual(groups[0].key, 'B');
        assert.strictEqual(groups[1].key, 'A');
    });

    test('removeItem should remove item and empty clusters', () => {
        const clusters = new Clusters((item) => item.category);
        clusters.addItem({ id: 1, category: 'A', name: 'Task 1' });
        clusters.addItem({ id: 2, category: 'A', name: 'Task 2' });

        assert.strictEqual(clusters.getItems().length, 2);

        clusters.removeItem({ id: 1, category: 'A' });
        assert.strictEqual(clusters.getItems().length, 1);
        assert.strictEqual(clusters.getClusters().length, 1);

        clusters.removeItem({ id: 2, category: 'A' });
        assert.strictEqual(clusters.getItems().length, 0);
        assert.strictEqual(clusters.getClusters().length, 0); // Cluster should be removed when empty
    });

    test('findCluster and findItemById', () => {
        const clusters = new Clusters((item) => item.category);
        clusters.addItem({ id: 1, category: 'A', name: 'Task 1' });
        clusters.addItem({ id: 2, category: 'C', name: 'Task 2' });

        const g1 = clusters.findCluster('A');
        assert.ok(g1);
        assert.strictEqual(g1.key, 'A');

        const gNull = clusters.findCluster('B');
        assert.strictEqual(gNull, undefined);

        const r1 = clusters.findItemById(1);
        assert.ok(r1);
        assert.strictEqual(r1.id, 1);

        const rNull = clusters.findItemById(99);
        assert.strictEqual(rNull, null);
    });

    test('setItems should replace all and sort by key', () => {
        const clusters = new Clusters((item) => item.category);

        clusters.addItem({ id: 99, category: 'Z' });

        clusters.setItems([
            { id: 1, category: 'A' },
            { id: 2, category: 'C' },
            { id: 3, category: 'A' },
        ]);

        const groups = clusters.getClusters();
        assert.strictEqual(groups.length, 2, 'Should have 2 clusters');

        assert.strictEqual(groups[0].key, 'C', 'First cluster should be C (descending)');
        assert.strictEqual(groups[0].items.length, 1);

        assert.strictEqual(groups[1].key, 'A');
        assert.strictEqual(groups[1].items.length, 2);

        assert.strictEqual(clusters.getItems().length, 3);

        // Ensure old records are gone
        assert.strictEqual(clusters.findItemById(99), null);
    });
    test('should sort by custom ordering if provided', () => {
        // Ascending instead of descending
        const clusters = new Clusters((item) => item.category, 'ASC');

        clusters.setItems([
            { id: 1, category: 'B' },
            { id: 2, category: 'A' },
            { id: 3, category: 'C' },
        ]);

        const groups = clusters.getClusters();
        assert.strictEqual(groups.length, 3);
        assert.strictEqual(groups[0].key, 'A');
        assert.strictEqual(groups[1].key, 'B');
        assert.strictEqual(groups[2].key, 'C');
    });
});

describe('NestedClusters', () => {
    test('should initialize empty', () => {
        const clusters = new NestedClusters([
            (item: any) => item.week,
            (item: any) => item.date
        ]);
        assert.deepStrictEqual(clusters.getClusters(), []);
        assert.deepStrictEqual(clusters.getItems(), []);
    });

    test('addItem and setItems should group recursively and sort correctly', () => {
        const clusters = new NestedClusters([
            (item: any) => item.week,
            (item: any) => item.date
        ], ['DESC', 'DESC']);

        clusters.setItems([
            { id: 1, week: 'W24', date: '2026-06-12', name: 'Task 1' },
            { id: 2, week: 'W24', date: '2026-06-11', name: 'Task 2' },
            { id: 3, week: 'W23', date: '2026-06-05', name: 'Task 3' },
        ]);

        const weeks = clusters.getClusters();
        assert.strictEqual(weeks.length, 2);
        
        // Check 1st level sorting (weeks descending)
        assert.strictEqual(weeks[0].key, 'W24');
        assert.strictEqual(weeks[1].key, 'W23');

        // Check 2nd level grouping and sorting for W24
        const w24Days = weeks[0].children;
        assert.strictEqual(w24Days.length, 2);
        assert.strictEqual(w24Days[0].key, '2026-06-12');
        assert.strictEqual(w24Days[1].key, '2026-06-11');
        assert.strictEqual(w24Days[0].items[0].id, 1);
        assert.strictEqual(w24Days[1].items[0].id, 2);

        // Check getItems returns all items
        assert.strictEqual(clusters.getItems().length, 3);

        // Test addItem
        clusters.addItem({ id: 4, week: 'W24', date: '2026-06-12', name: 'Task 4' });
        assert.strictEqual(w24Days[0].items.length, 2);
        assert.strictEqual(w24Days[0].items[1].id, 4);
    });

    test('removeItem should clean up empty branches recursively', () => {
        const clusters = new NestedClusters([
            (item: any) => item.week,
            (item: any) => item.date
        ], ['DESC', 'DESC']);

        clusters.setItems([
            { id: 1, week: 'W24', date: '2026-06-12', name: 'Task 1' },
            { id: 2, week: 'W24', date: '2026-06-11', name: 'Task 2' },
        ]);

        // Remove item 1 (leaves day 2026-06-12 empty)
        clusters.removeItem({ id: 1, week: 'W24', date: '2026-06-12' });
        const weeks = clusters.getClusters();
        assert.strictEqual(weeks[0].children.length, 1, 'Should clean up empty day branch');
        assert.strictEqual(weeks[0].children[0].key, '2026-06-11');

        // Remove item 2 (leaves week W24 empty)
        clusters.removeItem({ id: 2, week: 'W24', date: '2026-06-11' });
        assert.strictEqual(clusters.getClusters().length, 0, 'Should clean up empty week branch');
    });

    test('findItemById', () => {
        const clusters = new NestedClusters([
            (item: any) => item.week,
            (item: any) => item.date
        ]);

        clusters.setItems([
            { id: 1, week: 'W24', date: '2026-06-12' },
            { id: 2, week: 'W23', date: '2026-06-05' },
        ]);

        assert.ok(clusters.findItemById(1));
        assert.strictEqual(clusters.findItemById(1).id, 1);
        assert.strictEqual(clusters.findItemById(99), null);
    });
});
