const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 测试工具类
class AutoCommitTester {
  constructor() {
    this.testResults = [];
    this.tempDir = path.join(__dirname, 'test-temp');
  }

  // 运行测试
  async runTests() {
    console.log('🚀 开始运行 Auto Commit 测试...\n');
    
    try {
      await this.setupTestEnvironment();
      await this.testGitScript();
      await this.testWorkflowFile();
      await this.cleanup();
      this.printResults();
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
      await this.cleanup();
    }
  }

  // 设置测试环境
  async setupTestEnvironment() {
    console.log('📁 设置测试环境...');
    
    // 创建临时测试目录
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
    
    // 复制 git.sh 到测试目录
    const gitScriptPath = path.join(__dirname, 'git.sh');
    const testGitScriptPath = path.join(this.tempDir, 'git.sh');
    fs.copyFileSync(gitScriptPath, testGitScriptPath);
    
    // 设置执行权限
    execSync(`chmod +x ${testGitScriptPath}`);
    
    this.addTestResult('环境设置', true, '测试环境创建成功');
  }

  // 测试 git.sh 脚本
  async testGitScript() {
    console.log('🔧 测试 git.sh 脚本...');
    
    const gitScriptPath = path.join(__dirname, 'git.sh');
    
    // 检查文件是否存在
    const fileExists = fs.existsSync(gitScriptPath);
    this.addTestResult('git.sh 文件存在', fileExists, fileExists ? '文件存在' : '文件不存在');
    
    if (fileExists) {
      // 检查文件内容
      const content = fs.readFileSync(gitScriptPath, 'utf8');
      const hasGitAdd = content.includes('git add -A');
      const hasGitCommit = content.includes('git commit');
      const hasGitPush = content.includes('git push');
      const hasNoVerifyOption = content.includes('--no-verify');
      
      this.addTestResult('包含 git add -A', hasGitAdd, hasGitAdd ? '包含 git add 命令' : '缺少 git add 命令');
      this.addTestResult('包含 git commit', hasGitCommit, hasGitCommit ? '包含 git commit 命令' : '缺少 git commit 命令');
      this.addTestResult('包含 git push', hasGitPush, hasGitPush ? '包含 git push 命令' : '缺少 git push 命令');
      this.addTestResult('包含 --no-verify 选项', hasNoVerifyOption, hasNoVerifyOption ? '支持跳过验证' : '不支持跳过验证');
      
      // 检查脚本语法
      try {
        execSync(`bash -n ${gitScriptPath}`);
        this.addTestResult('脚本语法检查', true, '脚本语法正确');
      } catch (error) {
        this.addTestResult('脚本语法检查', false, '脚本语法错误: ' + error.message);
      }
    }
  }

  // 测试 GitHub Actions 工作流文件
  async testWorkflowFile() {
    console.log('⚙️ 测试 GitHub Actions 工作流...');
    
    const workflowPath = path.join(__dirname, '.github', 'workflows', 'auto-commit.yml');
    const workflowExists = fs.existsSync(workflowPath);
    
    this.addTestResult('工作流文件存在', workflowExists, workflowExists ? '工作流文件存在' : '工作流文件不存在');
    
    if (workflowExists) {
      const content = fs.readFileSync(workflowPath, 'utf8');
      const hasSchedule = content.includes('schedule:');
      const hasCron = content.includes('cron:');
      const hasWorkflowDispatch = content.includes('workflow_dispatch:');
      const hasNodeCommand = content.includes('node dist/index.js');
      
      this.addTestResult('包含定时任务', hasSchedule, hasSchedule ? '配置了定时任务' : '未配置定时任务');
      this.addTestResult('包含 cron 表达式', hasCron, hasCron ? '配置了 cron 表达式' : '未配置 cron 表达式');
      this.addTestResult('支持手动触发', hasWorkflowDispatch, hasWorkflowDispatch ? '支持手动触发' : '不支持手动触发');
      this.addTestResult('包含 Node.js 命令', hasNodeCommand, hasNodeCommand ? '包含 Node.js 执行命令' : '缺少 Node.js 执行命令');
    }
  }

  // 添加测试结果
  addTestResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed,
      message
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${message}`);
  }

  // 打印测试结果
  printResults() {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`总测试数: ${total}`);
    console.log(`通过测试: ${passed}`);
    console.log(`失败测试: ${total - passed}`);
    console.log(`成功率: ${successRate}%`);
    
    if (passed === total) {
      console.log('\n🎉 所有测试通过！Auto Commit 工具配置正确。');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查相关配置。');
    }
  }

  // 清理测试环境
  async cleanup() {
    console.log('\n🧹 清理测试环境...');
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('清理测试环境时出现警告:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new AutoCommitTester();
  tester.runTests().catch(console.error);
}

module.exports = AutoCommitTester;
