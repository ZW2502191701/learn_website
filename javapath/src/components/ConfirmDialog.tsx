export function ConfirmDialog({ message, onOk, onCancel }: { message: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>确认操作</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>取消</button>
          <button type="button" className="primary-btn danger" onClick={onOk}>确认</button>
        </div>
      </div>
    </div>
  );
}
