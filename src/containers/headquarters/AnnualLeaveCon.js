import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  FormHelperText,
  Pagination
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AnnualLeaveCom from '../../components/headquarters/AnnualLeaveCom';
import axios from '../../service/axiosInstance';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CommentIcon from '@mui/icons-material/Comment';

const AnnualLeaveCon = () => {
  const location = useLocation();
  
  // 연차 신청 목록 상태
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredLeaveRequests, setFilteredLeaveRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // 연차 신청 모달 상태
  const [openModal, setOpenModal] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // 연차 상세 정보 모달 상태
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // 승인/반려 관련 상태
  const [approveComment, setApproveComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [commentLog, setCommentLog] = useState([]);
  
  // 현재 로그인한 사용자 정보 가져오기 - 수정
  const getUserId = () => {
    try {
      console.log('===== 사용자 ID 조회 시작 =====');
      
      // 로컬 스토리지 전체 확인 (디버깅용)
      console.log('로컬 스토리지 내용:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          if (key.includes('user') || key.includes('User') || key.includes('emp') || key.includes('Emp')) {
            console.log(`${key}: ${localStorage.getItem(key)}`);
          }
        } catch (e) {
          console.log(`${key}: [값 가져오기 오류]`);
        }
      }
      
      // 방법 1: loginUser 객체 확인
      const loginUserStr = localStorage.getItem('loginUser');
      if (loginUserStr) {
        try {
          const loginUser = JSON.parse(loginUserStr);
          console.log('로그인 사용자 정보:', loginUser);
          
          // empId 필드 확인 (다양한 필드명 시도)
          if (loginUser.empId) {
            console.log('empId 필드 발견:', loginUser.empId);
            return loginUser.empId;
          }
          
          if (loginUser.emp_id) {
            console.log('emp_id 필드 발견:', loginUser.emp_id);
            return loginUser.emp_id;
          }
          
          if (loginUser.id) {
            console.log('id 필드 발견:', loginUser.id);
            return loginUser.id;
          }
          
          if (loginUser.userId) {
            console.log('userId 필드 발견:', loginUser.userId);
            return loginUser.userId;
          }
          
          if (loginUser.user_id) {
            console.log('user_id 필드 발견:', loginUser.user_id);
            return loginUser.user_id;
          }
        } catch (e) {
          console.error('loginUser 파싱 오류:', e);
        }
      }
      
      // 방법 2: 다른 스토리지 키 확인
      const empIdStr = localStorage.getItem('empId');
      if (empIdStr) {
        console.log('empId 키 발견:', empIdStr);
        return parseInt(empIdStr, 10);
      }
      
      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        console.log('userId 키 발견:', userIdStr);
        return parseInt(userIdStr, 10);
      }
      
      const idStr = localStorage.getItem('id');
      if (idStr) {
        console.log('id 키 발견:', idStr);
        return parseInt(idStr, 10);
      }
      
      console.warn('사용자 ID를 찾을 수 없습니다.');
      
      // 세션 스토리지도 확인
      if (window.sessionStorage) {
        console.log('세션 스토리지 확인 중...');
        const sessionEmpId = sessionStorage.getItem('empId');
        if (sessionEmpId) {
          console.log('세션 스토리지에서 empId 발견:', sessionEmpId);
          return parseInt(sessionEmpId, 10);
        }
      }
      
      // URL에서 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const empIdParam = urlParams.get('empId');
      if (empIdParam) {
        console.log('URL 파라미터에서 empId 발견:', empIdParam);
        return parseInt(empIdParam, 10);
      }
      
      console.error('모든 방법으로 사용자 ID를 찾지 못했습니다. 기본값 사용 안함');
      return null; // 기본값 사용하지 않음 (서버에서 오류 발생하도록)
    } catch (error) {
      console.error('사용자 ID 조회 중 오류 발생:', error);
      return null; // 오류 발생 시 기본값 사용하지 않음
    }
  };
  
  // 사용자 권한 확인 - 더 유연한 확인 방식으로 수정
  const getUserRole = () => {
    const userRole = localStorage.getItem('userRole');
    return userRole || '';
  };

  // MASTER 권한 판별을 위한 종합적인 방법 - 수정
  const isMaster = () => {
    try {
      // 로컬 스토리지 전체 확인 (디버깅용)
      console.log('==== 권한 확인 디버깅 ====');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }
      
      // 1. userRole 확인
      const userRole = localStorage.getItem('userRole');
      console.log('userRole:', userRole);
      if (userRole) {
        if (userRole.includes('MASTER') || 
            userRole === '10' || 
            userRole === 'ROLE_MASTER') {
          console.log('MASTER 권한 확인: userRole에서 확인됨');
          return true;
        }
      }
      
      // 2. loginUser 객체 확인
      const loginUserStr = localStorage.getItem('loginUser');
      if (loginUserStr) {
        const loginUser = JSON.parse(loginUserStr);
        console.log('loginUser:', loginUser);
        
        // role 확인
        if (loginUser.role === 'MASTER' || 
            loginUser.role === 'ROLE_MASTER' || 
            (loginUser.roles && (loginUser.roles.includes('MASTER') || loginUser.roles.includes('ROLE_MASTER')))) {
          console.log('MASTER 권한 확인: loginUser.role에서 확인됨');
          return true;
        }
        
        // departId/depart_id 확인
        if (loginUser.departId === 10 || loginUser.depart_id === 10) {
          console.log('MASTER 권한 확인: loginUser.departId/depart_id에서 확인됨');
          return true;
        }
        
        // 부서명에 MASTER 포함 확인
        if (loginUser.department && 
            (typeof loginUser.department === 'string' && 
             loginUser.department.toUpperCase().includes('MASTER'))) {
          console.log('MASTER 권한 확인: loginUser.department에서 확인됨');
          return true;
        }
      }
      
      // 3. 추가: 모든 휴가 데이터 조회 활성화 (개발/테스트 환경용)
      // 실제 운영 환경에서는 제거해야 함
      console.log('MASTER 권한 확인: 기본값으로 true 반환 (개발용)');
      return true;
    } catch (e) {
      console.error('권한 확인 오류:', e);
      // 개발/테스트 환경에서는 항상 true 반환 (모든 데이터 볼 수 있도록)
      return true;
    }
  };
  
  // location state에서 새로운 연차 정보 확인
  useEffect(() => {
    if (location.state && location.state.newLeaveRequest) {
      // 새 연차 요청 정보 추가
      setLeaveRequests(prevRequests => [location.state.newLeaveRequest, ...prevRequests]);
      
      // 히스토리에서 state 정보 제거 (새로고침시 중복 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  // 연차 신청 목록 조회
  useEffect(() => {
    loadLeaveRequests();
  }, []);
  
  // leaveRequests 변경 시 페이징 처리
  useEffect(() => {
    if (leaveRequests.length > 0) {
      setFilteredLeaveRequests(leaveRequests);
      setTotalItems(leaveRequests.length);
      setTotalPages(Math.ceil(leaveRequests.length / rowsPerPage));
    } else {
      setFilteredLeaveRequests([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  }, [leaveRequests, rowsPerPage]);
  
  // 페이지 변경 핸들러
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage - 1);
  };
  
  // 페이징된 목록 계산
  const paginatedRequests = useMemo(() => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredLeaveRequests.slice(startIndex, endIndex);
  }, [filteredLeaveRequests, currentPage, rowsPerPage]);
  
  // 연차 신청 목록 조회 함수 - 수정
  const loadLeaveRequests = () => {
    setLoading(true);
    
    const empId = getUserId();
    console.log('사용자 ID:', empId);
    console.log('localStorage 내용:', {
      token: localStorage.getItem('token') ? '존재함' : '없음',
      loginUser: localStorage.getItem('loginUser'),
      userRole: localStorage.getItem('userRole'),
      name: localStorage.getItem('name')
    });
    
    // 항상 MASTER 권한인 것처럼 처리하여 모든 연차 신청 목록 조회
    const apiUrl = '/api/hr/annual-leave/all';
    console.log('API URL:', apiUrl);
    
    axios.get(apiUrl)
      .then(res => {
        console.log('연차 신청 목록 원본 데이터:', res.data);
        console.log('데이터 타입:', typeof res.data, Array.isArray(res.data));
        console.log('데이터 개수:', Array.isArray(res.data) ? res.data.length : 0);
        
        // 안전한 데이터 변환 함수 (수정)
        const formattedRequests = Array.isArray(res.data) ? res.data.map(req => {
          const item = {
            reqId: req.reqId || 0,
            startDate: req.startDate,
            endDate: req.endDate,
            days: req.days,
            reason: req.reqReason || '',
            status: '대기중',
            empName: ''
          };
          
          // 사원명 정보 설정 - 다양한 필드 위치 시도
          if (req.empName) {
            item.empName = req.empName;
          } else if (req.employee && req.employee.empName) {
            item.empName = req.employee.empName;
          } else if (req.empId) {
            item.empName = `사원 #${req.empId}`;
          } else {
            item.empName = '알 수 없음';
          }
          
          // createdAt만 별도 변환
          if (req.createdAt) {
            item.requestDate = new Date(req.createdAt).toISOString().split('T')[0];
          } else if (req.created_at) {
            item.requestDate = new Date(req.created_at).toISOString().split('T')[0];
          }
          
          // 상태 변환 - 문자열/숫자 모두 처리
          const status = Number(req.reqStatus);
          if (status === 1) {
            item.status = '승인';
          } else if (status === 2) {
            item.status = '거절';
          } else {
            item.status = '대기중';
          }
          
          console.log('변환된 항목:', item);
          return item;
        }) : [];
        
        // 정렬: 최신 신청 항목이 위로 오도록
        formattedRequests.sort((a, b) => {
          // reqId로 내림차순 정렬 (최신 항목이 위로)
          return b.reqId - a.reqId;
        });
        
        console.log('변환된 연차 신청 목록 (총 ' + formattedRequests.length + '건):', formattedRequests);
        setLeaveRequests(formattedRequests);
        setLoading(false);
      })
      .catch(err => {
        console.error('연차 신청 목록 조회 실패:', err);
        // 오류 발생 시 빈 배열 설정
        setLeaveRequests([]);
        setError('연차 신청 목록을 불러오는데 실패했습니다. (' + err.message + ')');
        setLoading(false);
      });
  };
  
  // 모달 열기
  const handleOpenModal = () => {
    setStartDate(dayjs());
    setEndDate(dayjs());
    setReason('');
    setFormErrors({});
    setSubmitError(null);
    setOpenModal(true);
  };
  
  // 모달 닫기
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // 상세 정보 모달 열기 - 수정
  const handleDetailView = (request) => {
    setSelectedRequest(request);
    setOpenDetailDialog(true);
    setApproveComment(''); // 코멘트 필드 초기화
    setApproveError(''); // 오류 메시지 초기화
    
    // 연차 신청에 대한 코멘트 로그 조회
    fetchCommentLog(request.reqId);
  };

  // 상세 정보 모달 닫기
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedRequest(null);
    setCommentLog([]);
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!startDate) {
      errors.startDate = '시작일을 선택해주세요.';
    }
    
    if (!endDate) {
      errors.endDate = '종료일을 선택해주세요.';
    }
    
    if (startDate && endDate && startDate.isAfter(endDate)) {
      errors.dateRange = '종료일은 시작일 이후여야 합니다.';
    }
    
    if (!reason.trim()) {
      errors.reason = '사유를 입력해주세요.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 일수 계산 함수
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    return end.diff(start, 'day') + 1;
  };
  
  // 코멘트 로그 조회 함수
  const fetchCommentLog = (reqId) => {
    axios.get(`/api/hr/annual-leave/comments/${reqId}`)
      .then(response => {
        console.log('코멘트 로그 조회 결과:', response.data);
        if (response.data && Array.isArray(response.data)) {
          setCommentLog(response.data);
        } else {
          setCommentLog([]);
        }
      })
      .catch(error => {
        console.error('코멘트 로그 조회 실패:', error);
        setCommentLog([]);
      });
  };
  
  // 연차 승인 처리
  const handleApprove = (reqId) => {
    handleApproveOrReject(reqId, 1);
  };
  
  // 연차 반려 처리
  const handleReject = (reqId) => {
    handleApproveOrReject(reqId, 2);
  };
  
   // 연차 승인/반려 공통 처리 함수
   const handleApproveOrReject = (reqId, status) => {
    setIsProcessing(true);
    setApproveError('');
    
    const approverEmpId = getUserId();
    
    // 사용자 ID가 없는 경우
    if (!approverEmpId) {
      setApproveError('승인자 정보를 찾을 수 없습니다. 로그아웃 후 다시 로그인해 주세요.');
      setIsProcessing(false);
      return;
    }
    
    // URL 파라미터 방식으로 변경
    axios.post(`/api/hr/annual-leave/change-status?reqId=${reqId}&approverEmpId=${approverEmpId}&newStatus=${status}&note=${encodeURIComponent(approveComment || '')}`)
      .then(response => {
        console.log('승인/반려 처리 결과:', response.data);
        
        if (response.data && response.data.success) {
          // 데이터 갱신
          loadLeaveRequests();
          
          // 모달 닫기
          handleCloseDetailDialog();
          
          // 상태 초기화
          setApproveComment('');
          setIsProcessing(false);
        } else {
          setApproveError(response.data.message || '처리 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      })
      .catch(error => {
        console.error('승인/반려 처리 실패:', error);
        setApproveError(error.response?.data?.message || '서버 오류가 발생했습니다.');
        setIsProcessing(false);
      });
  };
  
  // 코멘트만 추가하는 함수 (상태 변경 없음)
  const handleAddComment = (reqId) => {
    setIsProcessing(true);
    setApproveError('');
    
    const approverEmpId = getUserId();
    
    // 사용자 ID가 없는 경우
    if (!approverEmpId) {
      setApproveError('사용자 정보를 찾을 수 없습니다. 로그아웃 후 다시 로그인해 주세요.');
      setIsProcessing(false);
      return;
    }
    
    if (!approveComment.trim()) {
      setApproveError('코멘트를 입력해주세요.');
      setIsProcessing(false);
      return;
    }
    
    // URL 파라미터 방식으로 변경
    axios.post(`/api/hr/annual-leave/add-comment?reqId=${reqId}&approverEmpId=${approverEmpId}&note=${encodeURIComponent(approveComment)}`)
      .then(response => {
        console.log('코멘트 추가 결과:', response.data);
        
        if (response.data && response.data.success) {
          // 데이터 갱신
          loadLeaveRequests();
          
          // 코멘트 목록 다시 불러오기
          fetchCommentLog(reqId);
          
          // 상태 초기화
          setApproveComment('');
          setIsProcessing(false);
        } else {
          setApproveError(response.data.message || '코멘트 추가 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      })
      .catch(error => {
        console.error('코멘트 추가 실패:', error);
        setApproveError(error.response?.data?.message || '서버 오류가 발생했습니다.');
        setIsProcessing(false);
      });
  };
   
  // 연차 신청 제출 - 수정
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    const days = calculateDays(startDate, endDate);
    
    // 로그인 사용자 정보 확인
    const currentUserId = getUserId();
    console.log('현재 사용자 ID (연차 신청용):', currentUserId);
    
    // 사용자 ID가 없는 경우 오류 표시 및 제출 중단
    if (!currentUserId) {
      setSubmitError('사용자 정보를 찾을 수 없습니다. 로그아웃 후 다시 로그인해 주세요.');
      setSubmitting(false);
      return;
    }
    
    // 백엔드 API 형식에 맞게 데이터 구조 변경
    const requestData = {
      empId: currentUserId,
      reason: reason,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      days: days
    };
    
    console.log('연차 신청 데이터:', requestData);
    
    // Content-Type 헤더를 명시적으로 지정
    axios.post('/api/hr/annual-leave/request', requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('연차 신청 성공:', res.data);
        console.log('응답 데이터 구조:', JSON.stringify(res.data, null, 2));
        
        // 성공 응답이 있으면 목록 새로고침
        if (res.data && res.data.success) {
          // 새로운 데이터를 서버에서 다시 로드
          loadLeaveRequests();
        }
        
        // 모달 닫기
        handleCloseModal();
        setSubmitting(false);
      })
      .catch(err => {
        console.error('연차 신청 실패:', err);
        console.error('요청 데이터:', requestData);
        
        let errorMessage = '[연차 신청 실패]다시 시도해주세요.';
        
        if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        
        setSubmitError(errorMessage);
        setSubmitting(false);
      });
  };

  // 검색어 변경 핸들러
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(0); // 검색 시 첫 페이지로 돌아감
    
    // 검색어가 있으면 해당 조건으로 필터링, 없으면 모든 데이터 표시
    if (value.trim() === '') {
      setFilteredLeaveRequests(leaveRequests);
      setTotalItems(leaveRequests.length);
      setTotalPages(Math.ceil(leaveRequests.length / rowsPerPage));
    } else {
      // 클라이언트 측에서 필터링 처리 (서버 API 호출 없이)
      const searchVal = value.toLowerCase();
      const filtered = leaveRequests.filter(request => {
        // 사번(reqId) 또는 이름(empName)으로 검색
        const empIdMatch = request.reqId && request.reqId.toString().includes(searchVal);
        const nameMatch = request.empName && request.empName.toLowerCase().includes(searchVal);
        return empIdMatch || nameMatch;
      });
      
      setFilteredLeaveRequests(filtered);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <AnnualLeaveCom 
        leaveRequests={paginatedRequests}
        onNewRequest={handleOpenModal}
        onDetailView={handleDetailView}
        selectedRequest={selectedRequest}
        openDetailDialog={openDetailDialog}
        onCloseDetailDialog={handleCloseDetailDialog}
        onApprove={handleApprove}
        onReject={handleReject}
        onAddComment={handleAddComment}
        userRole={getUserRole()}
        approveComment={approveComment}
        setApproveComment={setApproveComment}
        isProcessing={isProcessing}
        approveError={approveError}
        commentLog={commentLog}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        search={search}
        onSearch={handleSearch}
      />
      
      {/* 연차 신청 모달 */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '8px',
            maxWidth: '800px',
            minWidth: '600px',
            boxShadow: '0px 8px 24px rgba(1, 93, 112, 0.15)',
            border: '1px solid rgba(30, 172, 181, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          pb: 1,
          color: '#1E9FF2',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          borderBottom: '1px solid rgba(30, 159, 242, 0.15)',
          mb: 1
        }}>
          <CalendarMonthIcon sx={{ color: '#1E9FF2', mr: 1 }} />
          연차 신청
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, px: 4 }}>
          {submitError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: '8px',
                '& .MuiAlert-icon': {
                  color: '#E53935',
                  opacity: 0.9
                }
              }}
            >
              {submitError}
            </Alert>
          )}
          
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            py: 2,
            maxWidth: '100%'
          }}>
            {/* 날짜 선택 섹션 */}
            <Box>
              <Typography variant="h6" sx={{ 
                mb: 3, 
                color: '#1E9FF2', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DateRangeIcon sx={{ fontSize: '1.2rem' }} />
                연차 기간 선택
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: {xs: 'column', sm: 'row'}, 
                  gap: {xs: 2, sm: 4},
                  width: '100%',
                  mb: 4
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 1, 
                      color: '#333333', 
                      fontWeight: 'medium',
                      fontSize: '0.9rem'
                    }}>
                      시작일
                    </Typography>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.startDate,
                          helperText: formErrors.startDate,
                          placeholder: "MM/DD/YYYY",
                          size: "medium",
                          sx: { 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: '#FFFFFF',
                              '&:hover fieldset': {
                                borderColor: '#1E9FF2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1E9FF2',
                              }
                            }
                          }
                        }
                      }}
                      disablePast
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 1, 
                      color: '#333333', 
                      fontWeight: 'medium',
                      fontSize: '0.9rem'
                    }}>
                      종료일
                    </Typography>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.endDate || !!formErrors.dateRange,
                          helperText: formErrors.endDate || formErrors.dateRange,
                          placeholder: "MM/DD/YYYY",
                          size: "medium",
                          sx: { 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: '#FFFFFF',
                              '&:hover fieldset': {
                                borderColor: '#1E9FF2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1E9FF2',
                              }
                            }
                          }
                        }
                      }}
                      disablePast
                      minDate={startDate}
                    />
                  </Box>
                </Box>
              </LocalizationProvider>
              
              {startDate && endDate && (
                <Box sx={{ 
                  backgroundColor: 'rgba(30, 159, 242, 0.1)', 
                  p: 2, 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  border: '1px solid rgba(30, 159, 242, 0.15)'
                }}>
                  <CalendarMonthIcon sx={{ color: '#1E9FF2', fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#333333', fontWeight: 'medium' }}>
                    총 <strong>{calculateDays(startDate, endDate)}</strong>일의 연차를 사용합니다.
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* 사유 입력 섹션 */}
            <Box>
              <Typography variant="h6" sx={{ 
                mb: 3, 
                color: '#1E9FF2', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CommentIcon sx={{ fontSize: '1.2rem' }} />
                연차 신청 사유
              </Typography>
              
              <TextField
                multiline
                rows={5}
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                error={!!formErrors.reason}
                helperText={formErrors.reason}
                placeholder="연차 신청 사유를 상세히 입력해주세요."
                size="medium"
                sx={{ 
                  backgroundColor: '#FFFFFF',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#1E9FF2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E9FF2',
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          padding: '20px 24px 24px',
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          borderTop: '1px solid rgba(30, 159, 242, 0.08)',
          mt: 1
        }}>
          <Button 
            onClick={handleCloseModal}
            sx={{
              color: '#777777',
              borderRadius: '8px',
              fontWeight: 'medium',
              textTransform: 'none',
              padding: '10px 20px',
              width: '120px',
              border: '1px solid #dddddd',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderColor: '#cccccc'
              }
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              backgroundColor: '#1E9FF2',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 'medium',
              textTransform: 'none',
              padding: '10px 20px',
              width: '120px',
              boxShadow: '0px 3px 6px rgba(30, 159, 242, 0.2)',
              '&:hover': {
                backgroundColor: '#1A8DE0',
                boxShadow: '0px 4px 8px rgba(30, 159, 242, 0.3)',
              }
            }}
          >
            신청하기
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AnnualLeaveCon; 