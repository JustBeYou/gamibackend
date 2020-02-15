const chai = require('chai');
const expect = chai.expect;
const {FileInfo, FileInfoToModule} = require('../../models/fileInfo');
const {Module} = require('../../models/module');

/** 
 * This file is mostly testing the association functionality between
 * FileInfo and Module.
*/

async function createModule() {
    return await Module.create({
        type: 'UNDEFINED',
        index: 0,
    });
}

async function createFileInfo() {
    return await FileInfo.create({
        filename: 'undefined',
    });
}

describe('FileInfo and Module association testing', () => {
    it('should have association methods defined', async () => {
        const module = await createModule(); 

        expect(module.getFileInfos).to.be.a('Function');
        expect(module.addFileInfo).to.be.a('Function');
        expect(module.hasFileInfo).to.be.a('Function');
        expect(module.countFileInfos).to.be.a('Function');
        expect(module.createFileInfo).to.be.a('Function');
    });

    it('should add a new FileInfo to the Module', async() => {
        const module = await createModule();
        const fileInfo = await createFileInfo();

        await module.addFileInfo(fileInfo);
        const hasFileInfo = await module.hasFileInfo(fileInfo);
        expect(hasFileInfo).to.be.true;
    });
});