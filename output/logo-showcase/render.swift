import Foundation
import AVFoundation
import AppKit
import CoreVideo

let paths = [
    "/Users/nishtman/.codex/generated_images/01a10ad8-8c2f-7e91-a0aa-2b7da528759c/exec-04dfc506-9ffa-47b3-84f5-5e35e6ab780f.png",
    "/Users/nishtman/.codex/generated_images/01a10ad8-c070-74e1-9fd2-79bb1800a9b7/exec-f035ff72-e25b-4c48-85a6-1a07ea6be94a.png"
]
let images: [CGImage] = paths.map { path in
    let image = NSImage(contentsOfFile: path)!
    return image.cgImage(forProposedRect: nil, context: nil, hints: nil)!
}
let output = URL(fileURLWithPath: CommandLine.arguments[1])
let width = 1920, height = 1080, fps: Int32 = 30, frameCount = 300
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width, AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 8_000_000]
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input,
    sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true])
writer.add(input)
guard writer.startWriting() else { fatalError("Writer start failed: \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)
for frame in 0..<frameCount {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
    var buffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer) == kCVReturnSuccess else { fatalError("Buffer allocation failed") }
    let pixelBuffer = buffer!
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixelBuffer), width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    let t = Double(frame) / Double(fps)
    let blend = max(0, min(1, (t - 4.5) / 1.0))
    for index in 0..<2 {
        let opacity = index == 0 ? 1 - blend : blend
        if opacity == 0 { continue }
        let localTime = index == 0 ? t : max(0, t - 4.5)
        let zoom = 0.88 + 0.025 * min(1, localTime / 5)
        let image = images[index]
        let scale = min(Double(width) / Double(image.width), Double(height) / Double(image.height)) * zoom
        let w = Double(image.width) * scale, h = Double(image.height) * scale
        context.saveGState()
        context.setAlpha(opacity)
        context.interpolationQuality = .high
        context.draw(image, in: CGRect(x: (Double(width)-w)/2, y: (Double(height)-h)/2, width: w, height: h))
        context.restoreGState()
    }
    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
    guard adaptor.append(pixelBuffer, withPresentationTime: CMTime(value: Int64(frame), timescale: fps)) else {
        fatalError("Frame write failed: \(String(describing: writer.error))")
    }
}
input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting { semaphore.signal() }
semaphore.wait()
guard writer.status == .completed else { fatalError("Export failed: \(String(describing: writer.error))") }
let asset = AVURLAsset(url: output)
print("Created \(output.path)")
print("Duration: \(CMTimeGetSeconds(asset.duration)) seconds; \(width)x\(height); \(fps) fps")
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
let poster = try generator.copyCGImage(at: CMTime(seconds: 2, preferredTimescale: fps), actualTime: nil)
let bitmap = NSBitmapImageRep(cgImage: poster)
try bitmap.representation(using: .png, properties: [:])!.write(to: output.deletingLastPathComponent().appendingPathComponent("poster.png"))
