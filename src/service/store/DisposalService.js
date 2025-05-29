import axios from "../axiosInstance";

const token = localStorage.getItem("token");

// 폐기 대상 자동 조회
export const fetchExpiredDisposals = async () => {
  const res = await axios.get("/api/erp/disposal/expired");
  return res.data;
};

// 폐기 내역 전체 조회
export const fetchDisposalHistory = async () => {
  const res = await axios.get("/api/erp/disposal/history");
  return res.data;
};

// 폐기 내역 삭제(취소)
export const cancelDisposalById = async (disposalId) => {
  const res = await axios.delete(`/api/erp/disposal/cancel/${disposalId}`);
  return res.data;
};
