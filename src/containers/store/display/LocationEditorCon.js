import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import LocationEditorCom from '../../../components/store/display/LocationEditorCom';
import { fetchDisplayLocations, saveDisplayLocations } from '../../../service/store/DisplayLocationService';
import { saveProductLocationMapping } from '../../../service/store/StockService';

// 초기 생성 크기 상수 (픽셀 단위)
const DEFAULT_SIZE = {
  width: 200,
  height: 200,
};

// 새로운 레이아웃 아이템 생성 함수
const createNewItem = ({ x, y }) => ({
  i: Date.now().toString(),
  x,
  y,
  width: DEFAULT_SIZE.width,
  height: DEFAULT_SIZE.height,
  locationCode: '',
  label: '',
  type: 0,
});

export default function LocationEditorCon({ onClose, isEditMode, productLocationCode = [], onConfirmSave }) {
  const { productId } = useParams();
  const [layouts, setLayouts] = useState([]);
  const [selectedLocationCodes, setSelectedLocationCodes] = useState([]);

  // 1) 초기 로딩
  useEffect(() => {
    (async () => {
      const data = await fetchDisplayLocations();
      const initial = data.map((loc, idx) => ({
        i: loc.i?.toString() || `${idx}`,
        x: loc.x ?? loc.positionX ?? 0,
        y: loc.y ?? loc.positionY ?? 0,
        width: loc.width ?? loc.w ?? DEFAULT_SIZE.width,
        height: loc.height ?? loc.h ?? DEFAULT_SIZE.height,
        locationCode: loc.locationCode,
        label: loc.label,
        type: loc.type,
        locationId: loc.locationId,
      }));
      setLayouts(initial);
    })();
  }, []);

  // 2) 레이아웃 변경 (드래그/리사이즈 완료 시)
  const handleLayoutChange = useCallback(newLayout => {
    setLayouts(prev =>
      prev.map(item => {
        const match = newLayout.find(l => l.i === item.i);
        return match
          ? { ...item, x: match.x, y: match.y, width: match.w, height: match.h }
          : item;
      })
    );
  }, []);

  // 3) 입력 필드 변경
  const handleInputChange = useCallback((idx, field, value) => {
    setLayouts(prev => {
      const out = [...prev];
      out[idx] = { ...out[idx], [field]: value };
      return out;
    });
  }, []);

  // 4) 첫 빈 공간 찾기
  const findFirstEmpty = useCallback(() => {
    const occupied = new Set(layouts.map(l => `${l.x},${l.y}`));
    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < 12; col++) {
        if (!occupied.has(`${col},${row}`)) return { x: col, y: row };
      }
    }
    return { x: 0, y: (Math.max(...layouts.map(l => l.y)) || 0) + 1 };
  }, [layouts]);

  // 5) 새 위치 추가
  const handleAdd = useCallback(() => {
    const { x, y } = findFirstEmpty();
    setLayouts(prev => [...prev, createNewItem({ x, y })]);
  }, [findFirstEmpty]);

  // 6) 위치 삭제
  const handleDelete = useCallback(idx => {
    setLayouts(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // 7) 매핑 모드 선택/해제
  const handleSelectLocation = useCallback(code => {
    setSelectedLocationCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }, []);

  // 8) 유효성 검사
  const validate = useCallback(() => {
    for (const loc of layouts) {
      if (!loc.locationCode.trim()) {
        alert(`위치 코드가 비어 있습니다: ${loc.label || '(미입력)'}`);
        return false;
      }
    }
    return true;
  }, [layouts]);

  // 9) 진열 구조 저장
  const handleSaveLayout = useCallback(async () => {
    if (!validate()) return;
    await saveDisplayLocations(layouts);
    alert('진열 구조 저장 완료');
    onConfirmSave?.();
    onClose();
  }, [layouts, validate, onConfirmSave, onClose]);

  // 10) 상품-위치 매핑 저장
  const handleSaveMapping = useCallback(async () => {
    if (!selectedLocationCodes.length) {
      alert('위치를 선택해주세요.');
      return;
    }
  
    // 디버깅용 콘솔
    console.log("✅ 선택된 locationCode:", selectedLocationCodes);
    console.log("✅ 전체 layouts:", layouts);
  
    const ids = layouts
      .filter(l => selectedLocationCodes.includes(l.locationCode))
      .map(l => l.locationId)
      .filter(Boolean);
  
    console.log("✅ 추출된 locationId 목록:", ids); // 🔥 핵심 디버깅 포인트
  
    if (!ids.length) {
      alert('선택한 위치의 ID가 없습니다.');
      return;
    }
  
    await saveProductLocationMapping(Number(productId), ids);
    alert('위치 매핑 저장 완료');
    onConfirmSave?.();
    onClose();
  }, [layouts, selectedLocationCodes, productId, onConfirmSave, onClose]);
  

  return (
    <LocationEditorCom
      layouts={layouts}
      onAdd={handleAdd}
      onInputChange={handleInputChange}
      onLayoutChange={handleLayoutChange}
      onSave={isEditMode ? handleSaveLayout : handleSaveMapping}
      onDelete={handleDelete}
      isEditMode={isEditMode}
      productLocationCode={productLocationCode}
      selectedLocationCode={selectedLocationCodes}
      onSelectLocation={isEditMode ? null : handleSelectLocation}
    />
  );
}