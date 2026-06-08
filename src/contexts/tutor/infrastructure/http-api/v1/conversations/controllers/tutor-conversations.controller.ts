import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/contexts/shared/guards/jwt-auth.guard';
import { CONVERSATION_USE_CASE } from 'src/contexts/tutor/domain/contracts/i-conversation.use-case';
import type { IConversationUseCase } from 'src/contexts/tutor/domain/contracts/i-conversation.use-case';
import { MESSAGE_USE_CASE } from 'src/contexts/tutor/domain/contracts/i-message.use-case';
import type { IMessageUseCase } from 'src/contexts/tutor/domain/contracts/i-message.use-case';
import { CreateConversationRequest } from '../requests/create-conversation.request';
import { UpdateConversationRequest } from '../requests/update-conversation.request';
import { SendMessageRequest } from '../requests/send-message.request';

@ApiBearerAuth('access-token')
@ApiTags('Tutor')
@Controller('v1/tutor/conversations')
export class TutorConversationsController {
  constructor(
    @Inject(CONVERSATION_USE_CASE)
    private readonly conversationUseCase: IConversationUseCase,
    @Inject(MESSAGE_USE_CASE)
    private readonly messageUseCase: IMessageUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all conversations for the current user' })
  listConversations(@Request() req: { user: JwtPayload }) {
    return this.conversationUseCase.list(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  createConversation(
    @Request() req: { user: JwtPayload },
    @Body() body: CreateConversationRequest,
  ) {
    return this.conversationUseCase.create({
      userId: req.user.sub,
      title: body.title,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a conversation by ID' })
  getConversation(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
  ) {
    return this.conversationUseCase.get(id, req.user.sub);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a conversation' })
  updateConversation(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: UpdateConversationRequest,
  ) {
    return this.conversationUseCase.update({
      id,
      userId: req.user.sub,
      title: body.title,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  deleteConversation(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
  ) {
    return this.conversationUseCase.delete(id, req.user.sub);
  }

  @Get(':id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get messages for a conversation' })
  getMessages(@Request() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.messageUseCase.list(id, req.user.sub);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message and get AI response' })
  sendMessage(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: SendMessageRequest,
  ) {
    return this.messageUseCase.send({
      conversationId: id,
      userId: req.user.sub,
      content: body.content,
    });
  }

  @Post(':id/export/pdf')
  @ApiOperation({ summary: 'Export conversation as PDF' })
  async exportPdf(
    @Request() req: { user: JwtPayload },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.conversationUseCase.exportPdf(id, req.user.sub);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="conversation-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post(':id/audio')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({
    summary: 'Generate audio from conversation (not implemented)',
  })
  generateAudio() {
    return this.conversationUseCase.generateAudio();
  }
}
