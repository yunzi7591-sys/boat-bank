import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // WebViewのバウンス（ゴム紐スクロール）を完全に無効化
        if let scrollView = self.webView?.scrollView {
            scrollView.bounces = false
            scrollView.alwaysBounceVertical = false
            scrollView.alwaysBounceHorizontal = false
            scrollView.bouncesZoom = false
        }

        // キーボード閉じた時に WebView のスクロール位置を強制リセット
        // （iOS WKWebView の入力フォーカス後のスクロールが残るバグ対策）
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardDidHide),
            name: UIResponder.keyboardDidHideNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillShow),
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func keyboardDidHide() {
        guard let scrollView = self.webView?.scrollView else { return }
        // キーボード隠れた直後と少し遅れた時の2回リセット（取りこぼし防止）
        scrollView.setContentOffset(.zero, animated: false)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            scrollView.setContentOffset(.zero, animated: false)
        }
    }

    @objc func keyboardWillShow() {
        // キーボード出る前から WebView 側のスクロールを抑止
        guard let scrollView = self.webView?.scrollView else { return }
        scrollView.contentInset = .zero
        scrollView.scrollIndicatorInsets = .zero
    }
}
