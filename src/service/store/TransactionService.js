import axios from "../axiosInstance";

// 점주 storeId 기반 전체 거래 조회
export const fetchTransactionsByStore = async (storeId) => {
  const res = await axios.get("/api/pos/transactions", { params: { storeId } });
  return res.data;
};