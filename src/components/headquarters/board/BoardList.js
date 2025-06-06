// CORE-ERP-Frontend/src/components/headquarters/board/BoardList.js
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Collapse, Box, Typography, Button, Chip,
  IconButton, Pagination, Stack, InputBase, Divider
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/system';
import MuiChip from '@mui/material/Chip';

// 둥근 칩 스타일 (AnnualLeaveCom.js와 동일)
const RoundChip = styled(MuiChip)({
  borderRadius: '30px !important',
  minWidth: 80,
  fontWeight: 700,
  fontSize: '0.8rem',
  justifyContent: 'center',
});

// AnnualLeaveCom.js와 동일한 색상 로직
const getStatusColor = (status) => {
  switch(status) {
    case '답변완료':
      return { color: '#10B981', bgcolor: '#ECFDF5', borderColor: '#A7F3D0' };
    case '답변대기':
      return { color: '#F59E0B', bgcolor: '#FFFBEB', borderColor: '#FDE68A' };
    default:
      return { color: '#64748B', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' };
  }
};

// 게시글 행 컴포넌트
const BoardRow = ({ post, canManage, onAddComment, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const hasComment = post.hasComment && post.comments && post.comments.length > 0;
  
  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' }, 
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#F0F5FF' }
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell align="center">{post.postId}</TableCell>
        <TableCell align="center">{post.empName}</TableCell>
        <TableCell align="center">
          {post.boardTitle}
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="center">{format(new Date(post.boardCreatedAt), 'yyyy-MM-dd')}</TableCell>
        <TableCell align="center">
          {post.boardType > 1 && (
            hasComment ? 
              <RoundChip
                label="답변완료"
                size="small"
                sx={{
                  backgroundColor: getStatusColor('답변완료').bgcolor,
                  color: getStatusColor('답변완료').color,
                  border: '1px solid',
                  borderColor: getStatusColor('답변완료').borderColor,
                  minWidth: 80,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  justifyContent: 'center',
                }}
              /> : 
              <RoundChip
                label="답변대기"
                size="small"
                sx={{
                  backgroundColor: getStatusColor('답변대기').bgcolor,
                  color: getStatusColor('답변대기').color,
                  border: '1px solid',
                  borderColor: getStatusColor('답변대기').borderColor,
                  minWidth: 80,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  justifyContent: 'center',
                }}
              />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              {/* 제목+내용 박스 */}
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 2, p: 0 }}>
                <Box sx={{ pl: 2, pt: 2, pr: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
                    {post.boardTitle}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {post.boardContent}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    작성자: {post.empName} | 작성일: {format(new Date(post.boardCreatedAt), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                </Box>
              </Box>
              {/* 답변 */}
              {hasComment && (
                <Box sx={{ ml: 3, mb: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f7fafd', p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    답변
                  </Typography>
                  {post.comments.map(comment => (
                    <Box key={comment.commentId} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {comment.comContent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        답변자: {comment.empName || '관리자'} | 
                        답변일: {format(new Date(comment.comCreatedAt), 'yyyy-MM-dd HH:mm')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              
              {canManage && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  {!hasComment && post.boardType > 1 && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddComment(post);
                      }}
                      sx={{ mr: 1 }}
                    >
                      답변등록
                    </Button>
                  )}
                  <Button 
                    variant="outlined" 
                    color="success" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(post);
                    }}
                    sx={{ mr: 1 }}
                  >
                    수정
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('정말로 삭제하시겠습니까?')) {
                        onDelete(post.postId);
                      }
                    }}
                  >
                    삭제
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// 게시판 목록 컴포넌트
const BoardList = ({ 
  posts, 
  boardType, 
  canManage, 
  onAddPost, 
  onEditPost, 
  onDeletePost, 
  onAddComment,
  search = '',
  onSearch: onSearchProp
}) => {
  const boardTypeToTitle = {
    1: '공지사항',
    2: '건의사항',
    3: '점포 문의사항'
  };
  
  // 페이징 관련 상태
  const postsPerPage = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  // 검색어로 posts 필터링
  const filteredPosts = search
    ? posts.filter(
        (post) =>
          (post.boardTitle && post.boardTitle.toLowerCase().includes(search.toLowerCase())) ||
          (post.empName && post.empName.toLowerCase().includes(search.toLowerCase()))
      )
    : posts;

  // 현재 페이지에 해당하는 posts만 필터링
  const displayedPosts = filteredPosts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );
  
  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const [searchTerm, setSearchTerm] = useState(search);
  const onSearch = onSearchProp || ((term) => setSearchTerm(term));

  // 검색어 초기화 핸들러
  const handleClearSearch = () => {
    onSearch('');
    setSearchTerm('');
  };

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ width: '90%', maxWidth: 2200, mx: 'auto', mt: 4, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{
            fontWeight: 'bold',
            fontSize: 30,
            color: '#2563A6',
            letterSpacing: '-1px',
            ml: 15
          }}>
            {boardTypeToTitle[boardType] || '게시판'}
          </Typography>
        </Box>
      </Box>
      {/* 검색바 */}
      <Box sx={{ width: '90%', maxWidth: 1200, mx: 'auto', display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Paper
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: '2px 16px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            borderRadius: '30px',
            boxShadow: '0 2px 8px 0 rgba(85, 110, 223, 0.15)',
            border: '2px solid #005F9A',
            bgcolor: '#fff',
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1, fontSize: 18 }}
            placeholder="제목, 작성자 검색"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onSearch(e.target.value);
            }}
            inputProps={{ 'aria-label': '검색' }}
          />
          {searchTerm && (
            <IconButton
              onClick={handleClearSearch}
              sx={{ p: '10px', color: '#005F9A' }}
              aria-label="clear"
            >
              <ClearIcon />
            </IconButton>
          )}
          <IconButton
            type="submit"
            sx={{ p: '10px', color: '#005F9A' }}
            aria-label="search"
          >
            <SearchIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Paper>
      </Box>
      {/* 글쓰기 버튼 */}
      {(canManage || boardType > 1) && (
        <Box sx={{ width: '90%', maxWidth: 1200, mx: 'auto', mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => onAddPost(boardType)}
            sx={{
              backgroundColor: '#2563A6',
              '&:hover': { backgroundColor: '#1E5187' },
              borderRadius: '30px',
              px: 3,
              height: 40
            }}
          >
            글쓰기
          </Button>
        </Box>
      )}
      <Box sx={{ width: '90%', maxWidth: 1200, mx: 'auto' }}>
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f7ff' }}>
                <TableCell width="10%" align="center">번호</TableCell>
                <TableCell width="15%" align="center">작성자</TableCell>
                <TableCell width="50%" align="center">제목</TableCell>
                <TableCell width="15%" align="center">작성일</TableCell>
                <TableCell width="10%" align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedPosts.length > 0 ? (
                displayedPosts.map((post) => (
                  <BoardRow 
                    key={post.postId} 
                    post={post} 
                    canManage={canManage}
                    onAddComment={onAddComment}
                    onEdit={onEditPost}
                    onDelete={onDeletePost}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    게시글이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* 페이지네이션 */}
        {posts.length > 0 && (
          <Stack spacing={2} alignItems="center" sx={{ mt: 3, mb: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
              showFirstButton 
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1
                }
              }}
            />
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default BoardList;