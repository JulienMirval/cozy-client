import * as file from './file'
import { Qualification } from './document'

describe('File Model', () => {
  it('should test if a file is a note or not', () => {
    const fileDocument = {
      type: 'file',
      _id: 1
    }
    expect(file.isNote(fileDocument)).toBe(false)
    const note = {
      type: 'file',
      name: 'test.cozy-note',
      metadata: {
        content: 'content',
        schema: [],
        title: 'title',
        version: 1
      }
    }
    expect(file.isNote(note)).toBe(true)
    const note2 = {
      type: 'file',
      name: 'test.cozy-note',
      metadata: {
        content: 'content',
        schema: [],
        title: '',
        version: 0
      }
    }
    expect(file.isNote(note2)).toBe(true)
  })

  it('test if a file is a shortcut or not', () => {
    const shortcut = {
      type: 'file',
      class: 'shortcut'
    }

    const image = {
      type: 'file',
      class: 'image'
    }

    expect(file.isShortcut(shortcut)).toBe(true)
    expect(file.isShortcut(image)).toBe(false)
  })

  describe('normalizeFile', () => {
    const id = 'uuid123'
    const type = 'directory'

    it('should allow both `id` and `_id`', () => {
      const doc = { id, type }
      expect(file.normalize(doc)).toHaveProperty('_id', id)

      const _doc = { _id: id, type }
      expect(file.normalize(_doc)).toHaveProperty('_id', id)
    })

    it('should enforce a `_type`', () => {
      const doc = { id, type }
      expect(file.normalize(doc)).toHaveProperty('_type', 'io.cozy.files')
      expect(file.normalize(doc)).toHaveProperty('type', type)

      const doc2 = { id, _type: 'io.cozy.something.else' }
      expect(file.normalize(doc2)).toHaveProperty(
        '_type',
        'io.cozy.something.else'
      )

      const doc3 = { id }
      expect(file.normalize(doc3)).toHaveProperty('_type', 'io.cozy.files')
    })
  })

  describe('splitFilename', () => {
    const joinName = ({ filename, extension }) => filename + extension
    const mkFile = expectation => ({
      type: 'file',
      name: joinName(expectation)
    })
    const { stringify } = JSON

    const scenarios = [
      { filename: 'file', extension: '.ext' },
      { filename: 'file', extension: '' },
      { filename: 'file.html', extension: '.ejs' },
      { filename: 'file', extension: '.' },
      { filename: 'file.', extension: '.' },
      { filename: 'file.', extension: '.ext' },
      { filename: '.file', extension: '' },
      { filename: '.file', extension: '.ext' }
    ]

    for (const expectation of scenarios) {
      it(`splits ${stringify(joinName(expectation))} into ${stringify(
        expectation
      )}`, () => {
        expect(file.splitFilename(mkFile(expectation))).toEqual(expectation)
      })
    }

    it('should throw an error if the file is not correct', () => {
      expect(() => file.splitFilename({})).toThrow()
      expect(() => file.splitFilename({ name: null })).toThrow()
      expect(() => file.splitFilename({ name: '' })).not.toThrow()
    })
    it('should return only the folder name if its a folder', () => {
      const dir = {
        name: 'foo',
        type: 'directory'
      }
      const result = file.splitFilename(dir)
      expect(result).toEqual({
        filename: 'foo',
        extension: ''
      })
    })
  })

  describe('ensureFilePath', () => {
    const id = 'uuid123'
    const type = 'io.cozy.files'

    it('should define the path if parent is provided', () => {
      const doc = { id, name: 'myfile.ext' }
      const parent = { path: '/my/path' }
      expect(file.ensureFilePath(doc, parent)).toHaveProperty(
        'path',
        '/my/path/myfile.ext'
      )
    })

    it('should not require a `parent` parameter if one is present', () => {
      const doc = { id, type, path: '/test/file' }
      expect(file.ensureFilePath(doc)).toHaveProperty('path', '/test/file')
    })

    it('should not buid a `path` if the one is already present', () => {
      const doc = { id, type, path: '/test/file' }
      const parent = { id, type, path: '/test/parent' }
      expect(file.ensureFilePath(doc, parent)).toHaveProperty(
        'path',
        '/test/file'
      )
    })
  })

  describe('Sharing shortcuts', () => {
    const id = 'abc123'
    const type = 'io.cozy.files'

    const nonSharingShortcutDocument = { id, type }
    const sharingShortcutDocument = {
      ...nonSharingShortcutDocument,
      metadata: {
        sharing: { status: 'seen' },
        target: {
          mime: 'target-mimetype',
          _type: 'io.cozy.files'
        }
      }
    }
    const newShortcutDocument = {
      ...nonSharingShortcutDocument,
      metadata: {
        sharing: { status: 'new' },
        target: {
          mime: 'target-mimetype-2',
          _type: 'io.cozy.files'
        }
      }
    }

    it('identifies a sharing shortcut', () => {
      expect(file.isSharingShorcut(sharingShortcutDocument)).toBe(true)
      expect(file.isSharingShorcut(nonSharingShortcutDocument)).toBe(false)
    })

    it('detects if a sharing shortcut is new', () => {
      expect(file.isSharingShorcutNew(newShortcutDocument)).toBe(true)
      expect(file.isSharingShorcutNew(nonSharingShortcutDocument)).toBe(false)
      expect(file.isSharingShorcutNew(sharingShortcutDocument)).toBe(false)
    })

    it('returns the sharring shortcut status', () => {
      expect(file.getSharingShortcutStatus(newShortcutDocument)).toBe('new')
      expect(file.getSharingShortcutStatus(sharingShortcutDocument)).toBe(
        'seen'
      )
      expect(
        file.getSharingShortcutStatus(nonSharingShortcutDocument)
      ).toBeUndefined()
    })

    it('returns the sharring shortcut target mime type', () => {
      expect(file.getSharingShortcutTargetMime(newShortcutDocument)).toBe(
        'target-mimetype-2'
      )
      expect(file.getSharingShortcutTargetMime(sharingShortcutDocument)).toBe(
        'target-mimetype'
      )
      expect(
        file.getSharingShortcutTargetMime(nonSharingShortcutDocument)
      ).toBeUndefined()
    })

    it('returns the sharring shortcut target doctype', () => {
      expect(
        file.getSharingShortcutTargetDoctype(sharingShortcutDocument)
      ).toBe('io.cozy.files')
      expect(
        file.getSharingShortcutTargetMime(nonSharingShortcutDocument)
      ).toBeUndefined()
    })
  })
})

describe('File qualification', () => {
  let mockedClient
  let updateMetadataAttribute
  beforeEach(() => {
    updateMetadataAttribute = jest.fn()
    mockedClient = {
      collection: name => ({
        updateMetadataAttribute
      })
    }
  })

  it('should save the qualification', async () => {
    updateMetadataAttribute.mockImplementation((_id, attributes) => {
      return { _id, metadata: { ...attributes } }
    })
    const fileDoc = {
      _id: '123',
      metadata: {
        datetime: '2020-01-01T20:38:04Z'
      }
    }
    const qualification = Qualification.getByLabel('health_invoice')
    const updFile = await file.saveFileQualification(
      mockedClient,
      fileDoc,
      qualification
    )
    expect(updFile).toEqual({
      _id: '123',
      metadata: {
        datetime: '2020-01-01T20:38:04Z',
        qualification: {
          label: 'health_invoice',
          sourceCategory: 'health',
          purpose: 'invoice'
        }
      }
    })
  })
})
