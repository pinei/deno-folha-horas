import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Bucket, Buckets } from './buckets';
import { Clusters } from './clusters';

describe('Buckets', () => {
    test('addBucket maintains order of insertion', () => {
        const buckets = new Buckets();
        const c1 = new Clusters((item: any) => item.category);
        const c2 = new Clusters((item: any) => item.category);

        const b1 = new Bucket('todo', 'To Do', 'gray', c1);
        const b2 = new Bucket('done', 'Done', 'green', c2);

        buckets.addBucket(b1);
        buckets.addBucket(b2);

        const list = buckets.getBuckets();
        assert.strictEqual(list[0].name, 'todo');
        assert.strictEqual(list[1].name, 'done');
    });

    test('moveItem moves an item from one bucket to another', () => {
        const buckets = new Buckets();
        const c1 = new Clusters((item: any) => item.category);
        const c2 = new Clusters((item: any) => item.category);

        const b1 = new Bucket('todo', 'To Do', 'gray', c1);
        const b2 = new Bucket('done', 'Done', 'green', c2);

        buckets.addBucket(b1);
        buckets.addBucket(b2);

        // Add item to first bucket's clusters
        const item = { id: 1, category: 'A', name: 'Task 1' };
        b1.clusters.addItem(item);

        assert.strictEqual(b1.clusters.getItems().length, 1);
        assert.strictEqual(b2.clusters.getItems().length, 0);

        // Move item
        buckets.moveItem(1, 'todo', 'done');

        assert.strictEqual(b1.clusters.getItems().length, 0);
        assert.strictEqual(b2.clusters.getItems().length, 1);

        const movedItem = b2.clusters.findItemById(1);
        assert.ok(movedItem);
        assert.strictEqual(movedItem?.name, 'Task 1');
    });

    test('moveItem fails gracefully if buckets not found', () => {
        const buckets = new Buckets();
        const c1 = new Clusters((item: any) => item.category);
        const b1 = new Bucket('todo', 'To Do', 'gray', c1);
        buckets.addBucket(b1);

        b1.clusters.addItem({ id: 1, category: 'A', name: 'Task 1' });

        // Non-existent destination
        buckets.moveItem(1, 'todo', 'missing');
        assert.strictEqual(b1.clusters.getItems().length, 1);

        // Non-existent source
        buckets.moveItem(2, 'missing', 'todo');
        assert.strictEqual(b1.clusters.getItems().length, 1);
    });

    test('moveItem fails gracefully if item not found', () => {
        const buckets = new Buckets();
        const c1 = new Clusters((item: any) => item.category);
        const c2 = new Clusters((item: any) => item.category);
        const b1 = new Bucket('todo', 'To Do', 'gray', c1);
        const b2 = new Bucket('done', 'Done', 'green', c2);
        buckets.addBucket(b1);
        buckets.addBucket(b2);

        b1.clusters.addItem({ id: 1, category: 'A', name: 'Task 1' });

        buckets.moveItem(99, 'todo', 'done');
        assert.strictEqual(b1.clusters.getItems().length, 1);
        assert.strictEqual(b2.clusters.getItems().length, 0);
    });
});
