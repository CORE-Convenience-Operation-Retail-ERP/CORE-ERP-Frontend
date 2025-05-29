import axios from "../axiosInstance";

// ERP 백엔드 정산 이력 조회 API 호출
export const fetchSettlementList = async (params) => {
  const res = await axios.get("/api/erp/settlement/list", { params });
  return res.data;
};
