import axios from '../axiosInstance';

/** ✅ 공통 에러 핸들링 */
const handleRequest = async (apiCall) => {
    try {
        return await apiCall();
    } catch (err) {
        const msg =
            typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || err.message || '서버 오류 발생';
        return Promise.reject(msg);
    }
};

/** ✅ 실사 등록 */
export const registerInventoryCheck = ({ storeId, partTimerId, reason, checks }) =>
    handleRequest(() =>
        axios.post('/api/store/inventory-check', { storeId, partTimerId, reason, checks })
    );

/** ✅ 실사 제품 목록 조회 (재고 현황 기준, 페이징 포함) */
export const fetchInventoryProductList = ({ productName, barcode, page = 0, size = 10 }) =>
    handleRequest(() =>
        axios.get('/api/stock/summary', {
            params: { productName, barcode, page, size },
        })
    );

/** ✅ 실사 이력 조회 (페이징, 검색 포함) */
export const fetchInventoryCheckList = (params = {}) =>
    handleRequest(() =>
        axios.get('/api/store/inventory-check/history', { params })
    );

/** ✅ 다건 실사 일괄 반영 */
export const applyInventoryCheckBulk = (checkItemIds) =>
    handleRequest(() =>
        axios.patch('/api/store/inventory-check/apply-batch',  checkItemIds )
    );

/** ✅ 미반영 전체 실사 일괄 반영 */
export const applyInventoryCheckAll = () =>
    handleRequest(() =>
    axios.patch('/api/store/inventory-check/apply-all'));

/** ✅ 다건 실사 일괄 롤백 */
export const rollbackInventoryCheckBulk = (checkItemIds) =>
    handleRequest(() =>
        axios.patch('/api/store/inventory-check/rollback-batch', checkItemIds)
    );

/** ✅ 전체 실사 일괄 롤백 */
export const rollbackInventoryCheckAll = () =>
    handleRequest(() =>
        axios.patch('/api/store/inventory-check/rollback-all')
    );
