import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── uploadImage ────────────────────────────────────────────────────────────

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      fieldname: 'file',
      encoding: '7bit',
      size: 1024,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload an image successfully', async () => {
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/blog/abc123.webp',
        public_id: 'blog/abc123',
        width: 800,
        height: 600,
        bytes: 50000,
        format: 'webp',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          // Simulate the writable stream
          const writable = new (require('stream').Writable)({
            write(_chunk: any, _encoding: any, cb: () => void) {
              cb();
            },
          });
          // Call callback with success after stream ends
          writable.on('finish', () => {
            callback(null, mockResult);
          });
          return writable;
        },
      );

      const result = await service.uploadImage(mockFile, 'blog');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'blog',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        expect.any(Function),
      );
      expect(result.secure_url).toBe(mockResult.secure_url);
      expect(result.public_id).toBe('blog/abc123');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.bytes).toBe(50000);
      expect(result.format).toBe('webp');
    });

    it('should throw BadRequestException on upload error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          const writable = new (require('stream').Writable)({
            write(_chunk: any, _encoding: any, cb: () => void) {
              cb();
            },
          });
          writable.on('finish', () => {
            callback(new Error('Upload failed'), null);
          });
          return writable;
        },
      );

      await expect(service.uploadImage(mockFile, 'blog')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when result is null', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          const writable = new (require('stream').Writable)({
            write(_chunk: any, _encoding: any, cb: () => void) {
              cb();
            },
          });
          writable.on('finish', () => {
            callback(null, null);
          });
          return writable;
        },
      );

      await expect(service.uploadImage(mockFile, 'blog')).rejects.toThrow(BadRequestException);
    });

    it('should use the correct folder for posts', async () => {
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/posts/img.webp',
        public_id: 'posts/img123',
        width: 400,
        height: 300,
        bytes: 20000,
        format: 'webp',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          const writable = new (require('stream').Writable)({
            write(_chunk: any, _encoding: any, cb: () => void) {
              cb();
            },
          });
          writable.on('finish', () => {
            callback(null, mockResult);
          });
          return writable;
        },
      );

      await service.uploadImage(mockFile, 'posts');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'posts' }),
        expect.any(Function),
      );
    });
  });

  // ── deleteImage ────────────────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('should call cloudinary destroy with publicId', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteImage('blog/abc123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('blog/abc123');
    });

    it('should call destroy for posts images', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteImage('posts/img-456');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('posts/img-456');
    });
  });
});
