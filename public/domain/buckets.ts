import { Clusters } from './clusters';

/*
 * Bucket is a container for clusters.
 * It has a name, a label and a list of clusters.
 */
export class Bucket {
    name: string;
    label: string;
    color: string;
    clusters: Clusters;

    constructor(name: string, label: string, color: string, clusters: Clusters) {
        this.name = name;
        this.label = label;
        this.color = color;
        this.clusters = clusters;
    }
}

/*
 * Manages an ordered collection of Bucket instances (sorted by ascending index).
 */
export class Buckets {
    buckets: Bucket[] = [];

    getBuckets(): Bucket[] {
        return this.buckets;
    }

    addBucket(bucket: Bucket): void {
        this.buckets.push(bucket);
    }

    addItem(item: any, bucketName: string): void {
        const bucket = this.buckets.find(b => b.name === bucketName);
        if (bucket) {
            bucket.clusters.addItem(item);
        }
    }

    removeItem(item: any, bucketName: string): void {
        const bucket = this.buckets.find(b => b.name === bucketName);
        if (bucket) {
            bucket.clusters.removeItem(item);
        }
    }

    moveItem(itemId: string | number, fromBucketName: string, toBucketName: string): void {
        const fromBucket = this.buckets.find(b => b.name === fromBucketName);
        const toBucket = this.buckets.find(b => b.name === toBucketName);

        if (!fromBucket || !toBucket) {
            return;
        }

        const item = fromBucket.clusters.findItemById(itemId);
        if (item) {
            fromBucket.clusters.removeItem(item);
            toBucket.clusters.addItem(item);
        }
    }
}
