# Web Summarizer & Translator Chrome Extension

[ENGLISH DOCS](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/blob/main/README-EN.md)

[CHROME EXTENSION](https://chromewebstore.google.com/detail/web-summarizer-translator/efbnphdkhkehgbmgegjldhdknkbpljke)

Phần mở rộng Chrome này cung cấp cho người dùng các tính năng mạnh mẽ được cung cấp bởi trí tuệ nhân tạo để tóm tắt, dịch, sửa lỗi tiếng Anh và phát âm văn bản trực tiếp từ bất kỳ trang web nào.
> [!NOTE]
> - Hiện tại Groq cung cấp API sử dụng model LLAMA 3 70B miễn phí, anh em đăng ký 1 account để lấy API mà dùng https://console.groq.com/keys
> - Dùng OpenAI tốc độ trả lời rất chậm mà mất phí.
> - Thông tin thêm là, tuy dùng LLAMA 3 70B trên Groq nhanh nhưng lại khó ép buộc model trả về tiếng Việt
> - Groq rate limit: https://console.groq.com/docs/rate-limits



https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/6a29069d-7bc0-458e-a76c-c969b3c8ef53

## Tính năng

- **Tóm tắt Văn bản:** Nhanh chóng nhận được tóm tắt ngắn gọn và toàn diện của bất kỳ văn bản nào được chọn.
- **Dịch Văn bản:** Dịch văn bản được chọn một cách dễ dàng sang một ngôn ngữ khác.
- **Sửa lỗi Tiếng Anh:** Xác định và sửa lỗi ngữ pháp trong văn bản tiếng Anh.
- **Phát âm Văn bản:** Nghe phát âm của văn bản được chọn với tổng hợp giọng nói.

![menu](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/bfc2e665-69fe-45e5-bb23-b7a0c58bcb96)

## Cài đặt

1. **Tải xuống phần mở rộng:** Tải xuống tệp `.zip` từ kho lưu trữ này. [Release](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/releases)
2. **Mở Trình mở rộng Chrome:** Mở Chrome và gõ `chrome://extensions/` vào thanh địa chỉ.
3. **Bật Chế độ Phát triển viên:** Bật chuyển đổi "Chế độ Phát triển viên".
4. **Tải Gói không đóng gói:** Nhấp vào "Tải gói không đóng gói" và chọn thư mục mà bạn đã giải nén tệp `.zip`.

## Sử dụng (rất dễ dàng)

1. **Chọn Văn bản:** Đánh dấu văn bản mà bạn muốn tóm tắt, dịch, sửa lỗi hoặc phát âm.
2. **Nhấp chuột phải:** Nhấp chuột phải vào văn bản được chọn và chọn hành động mong muốn từ menu ngữ cảnh.

## Tùy chọn

Bạn có thể tùy chỉnh cài đặt của phần mở rộng bằng cách truy cập trang Tùy chọn:

1. **Mở Trình mở rộng Chrome:** Đi tới `chrome://extensions/`.
2. **Nhấp vào biểu tượng của phần mở rộng:** Tìm biểu tượng của phần mở rộng và nhấp vào nó.
3. **Chọn "Tùy chọn":** Nhấp vào liên kết "Tùy chọn" trong hộp thoại mở rộng.

Trên trang Tùy chọn, bạn có thể thiết lập:
![settings](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/cab02f16-922d-4193-9109-166a55685304)

- **API URL:** Điểm cuối API cho dịch vụ AI được chọn.
  - Đối với **OpenAI**, URL thường là: `https://api.openai.com/v1/chat/completions`.
  - Groq: `https://api.groq.com/openai/v1/chat/completions`

- **API KEY:** Khóa API của bạn cho dịch vụ AI.
    - **Nhận khóa API của bạn từ OpenAI:** [https://platform.openai.com/settings/profile?tab=api-keys](https://platform.openai.com/settings/profile?tab=api-keys)
    - **Nhận khóa API của bạn từ Groq:** [https://console.groq.com/keys](https://console.groq.com/keys)
- **Model Name:** Mô hình AI cụ thể bạn muốn sử dụng. Đề xuất nên sử dụng `llama3-70b-8192` trên Groq bởi vì nó trả lời nhanh, mặc dù tiếng Việt hơi kém.
- **Temperature:** Điều chỉnh sự sáng tạo và ngẫu nhiên của đầu ra của AI.
- **Max Token:** Giới hạn độ dài của phản hồi của AI.
- **API Key của Open AI Whisper:** Khóa API của bạn cho dịch vụ chuyển văn bản thành âm thanh của OpenAI (cho tính năng Phát âm).
    - **Nhận khóa API của OpenAI Whisper của bạn:** [https://platform.openai.com/settings/profile?tab=api-keys](https://platform.openai.com/settings/profile?tab=api-keys) 
- **Open AI Whisper Model Name:** Mô hình Whisper cụ thể cho chuyển văn bản thành âm thanh.
- **Voice Name:** Giọng bạn muốn sử dụng cho việc phát âm (echo, alloy...)
- Xem thêm: [https://platform.openai.com/docs/guides/text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)

## Demo
![demo1](https://github.com/minhhungit/WebSummarizerTranslatorChromeExtension/assets/2279508/febbbd24-a87d-4a75-8046-a45a008980de)

## Đóng góp

Mọi đóng góp đều được hoan nghênh!

## Giấy phép

Dự án này được cấp phép theo [Giấy phép MIT](LICENSE).
