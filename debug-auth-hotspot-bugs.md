# Debug Session: auth-hotspot-bugs
- **Status**: [OPEN]
- **Issue**: 发帖页提交时报 `Cannot read properties of null (reading 'reset')`；热点雷达生成时报 `no hotspot results found`
- **Debug Server**: pending
- **Log File**: .dbg/trae-debug-log-auth-hotspot-bugs.ndjson

## Reproduction Steps
1. 登录后进入 `发帖` 页面并提交表单。
2. 观察前端是否在请求成功后报 `reset` 相关异常。
3. 登录后进入 `热点雷达` 页面并点击“立即生成热点草稿”。
4. 观察后端是否返回 `no hotspot results found`。

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `发帖` 页在 `await` 之后访问 `e.currentTarget`，导致事件对象为空 | High | Low | Pending |
| B | 登录态未正确刷新，导致界面导航和个人页没有同步当前用户 | Med | Med | Pending |
| C | WebSearch 返回结构与当前解析逻辑不匹配，结果被解析为空 | High | Med | Pending |
| D | WebSearch 请求方法/参数/请求头不符合接口要求，导致只有空响应 | Med | Med | Pending |
| E | 后端热点生成链路缺少原始搜索结果埋点，无法区分“真无结果”和“解析失败” | High | Low | Pending |

## Log Evidence
- Hypothesis A: `frontend/app/posts/create/page.tsx` currently在 `await api(...)` 之后直接执行 `e.currentTarget.reset()`，这是最可疑空指针点。
- Hypothesis C/D: 本地复现 `POST /api/v1/ai/hotspots/generate` 返回 `{"code":40001,"message":"no hotspot results found"}`。
- Hypothesis D: 直接请求 WebSearch endpoint 时，默认 TLS 校验报 `CERTIFICATE_VERIFY_FAILED`。
- Hypothesis D: 跳过 TLS 校验后，接口返回 `invalid_api_key`，说明当前搜索接口未被正确授权。

## Verification Conclusion
- Pending
