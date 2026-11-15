import { MarkDb } from './maindb';

/** Temporary runtime adapter until MarkDb defines its shutdown lifecycle. */
export class FakeMarkDb extends MarkDb {
    close(): void {
        return;
    }
}