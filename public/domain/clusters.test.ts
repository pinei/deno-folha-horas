import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Clusters } from './clusters';

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
