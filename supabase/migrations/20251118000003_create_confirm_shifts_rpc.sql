-- シフト一括確定RPC関数（トランザクション保証）
-- バリデーション → 行ロック → 一括更新を単一トランザクション内で実行
CREATE OR REPLACE FUNCTION confirm_shifts(
  p_shift_ids UUID[],
  p_updated_by UUID
)
RETURNS TABLE(confirmed_count INTEGER, confirmed_ids UUID[]) AS $$
DECLARE
  v_found_count INTEGER;
  v_already_confirmed INTEGER;
  v_confirmed_ids UUID[];
BEGIN
  -- 入力検証
  IF p_shift_ids IS NULL OR array_length(p_shift_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: 確定対象のシフトIDが指定されていません';
  END IF;

  -- 行ロック取得（FOR UPDATEで同時更新を防止）
  SELECT count(*)
  INTO v_found_count
  FROM shifts
  WHERE id = ANY(p_shift_ids)
  FOR UPDATE;

  -- 対象シフトが存在するか確認
  IF v_found_count = 0 THEN
    RAISE EXCEPTION 'VALIDATION: 確定対象のシフトが見つかりません';
  END IF;

  -- 確定済みシフトのチェック
  SELECT count(*)
  INTO v_already_confirmed
  FROM shifts
  WHERE id = ANY(p_shift_ids) AND status = '確定';

  IF v_already_confirmed > 0 THEN
    RAISE EXCEPTION 'VALIDATION: 既に確定済みのシフトが%件含まれています', v_already_confirmed;
  END IF;

  -- 一括更新（トリガーがversion + updated_atを自動更新）
  UPDATE shifts
  SET status = '確定', updated_by = p_updated_by
  WHERE id = ANY(p_shift_ids) AND status != '確定';

  -- 確定されたIDを取得
  SELECT ARRAY(
    SELECT id FROM shifts
    WHERE id = ANY(p_shift_ids) AND status = '確定'
  ) INTO v_confirmed_ids;

  RETURN QUERY SELECT v_found_count, v_confirmed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 実行権限付与
GRANT EXECUTE ON FUNCTION confirm_shifts(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_shifts(UUID[], UUID) TO anon;
