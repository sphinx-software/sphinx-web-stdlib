import TestSuite from "WaveFunction/TestSuite";
import {testCase} from "WaveFunction/decorators";
import Serializer from "../../../src/Fusion/Serializer/Serializer";
import FileSystemAdapter from "../../../src/Fusion/Storage/Filesystem/FilesystemStorageAdapter"
import StorageFileNamingConvention from "../../../src/Fusion/Storage/Filesystem/StorageFileNamingConvention";
import {assert} from "chai";
import sinon from "sinon";

export default class FileSystemStorageAdapterTestSuite extends TestSuite {

    adapter = null;

    beforeEach() {
        this.clock = sinon.useFakeTimers();
        this.serializer = new Serializer();
        this.serializer.forType(Object, i => i, i => i);
        this.fs = {
            readFileSync: () => {},
            writeFileSync: () => {},
            unlinkSync: () => {},
            readdirSync: () => {}
        };

        this.readFileSyncSpy = sinon.stub(this.fs, 'readFileSync');
        this.writeFileSyncSpy = sinon.stub(this.fs, 'writeFileSync');
        this.unlinkSyncSpy = sinon.stub(this.fs, 'unlinkSync');
        this.readdirSyncSpy = sinon.stub(this.fs, 'readdirSync');

        this.namming = new StorageFileNamingConvention();
        this.namming.setPrefix('somePrefix');
        this.adapter = new FileSystemAdapter(this.serializer, this.namming, this.fs);
        this.adapter.setStorageDirectory('someDir');
    }

    afterEach() {
        this.readFileSyncSpy.restore();
        this.writeFileSyncSpy.restore();
        this.unlinkSyncSpy.restore();
        this.readdirSyncSpy.restore();
    }

    @testCase()
    async testSetTheValueSuccessful() {
        await this.adapter.set('someKey', {foo: 'bar'});

        assert(this.writeFileSyncSpy.calledWith(
            this.namming.nameFor('someDir', 'someKey'),
            this.serializer.serialize({foo: 'bar'}),
        ));
    }

    @testCase()
    async testGetTheExistedValueSuccessful() {
        this.readFileSyncSpy.returns(this.serializer.serialize({foo: 'bar'}));

        assert.deepEqual({foo: 'bar'}, await this.adapter.get('someKey'));
        assert(this.readFileSyncSpy.calledWith(
            this.namming.nameFor('someDir', 'someKey')
        ));
    }

    @testCase()
    async testGetTheNotExitedValueSuccessful() {
        this.readFileSyncSpy.returns(null);

        assert.isNull(await this.adapter.get('someKey'));
        assert(this.readFileSyncSpy.calledWith(
            this.namming.nameFor('someDir', 'someKey')
        ));
    }

    @testCase()
    async testUnsetTheKeySuccessful() {
        await this.adapter.unset('someKey');
        assert(this.unlinkSyncSpy.calledWith(this.namming.nameFor('someDir', 'someKey')));
    }

    @testCase()
    async testFlushSuccessful() {
        this.readdirSyncSpy.returns([
            'someFile.dat',
            'someOtherFile.dat'
        ]);
        await this.adapter.flush();
        assert(this.unlinkSyncSpy.calledWith('someDir/someFile.dat'));
        assert(this.unlinkSyncSpy.calledWith('someDir/someOtherFile.dat'));
    }
}
